import { prisma } from '../../database/db';
import { generateShortCode } from './code-generator';
import { validateSafeDestinationUrl } from './url-validator';
import { validateCustomAlias } from './alias-validator';
import { appendUtmParameters } from './utm-helper';
import { ConflictError, NotFoundError, RateLimitError, BadRequestError } from '../../errors/app-error';
import { env } from '../../config/env';
import {
  BulkImportInput,
  BulkImportResultDto,
  BulkImportRowResult,
  CreateLinkInput,
  LinkDto,
  PaginatedMeta,
  PaginationQueryInput,
  UpdateLinkInput,
} from '@shortener/shared';
import { logger } from '../../utils/logger';
import { redirectCache } from '../redirects/redirect-cache';

// In-memory sliding window rate-limiter for anonymous IP creations (1 link per 24h)
const anonymousIpUsage = new Map<string, number>();

export class LinksService {
  public static readonly MAX_MONTHLY_LINKS_PER_USER = 10;
  public static readonly MAX_ANONYMOUS_LINKS_PER_IP = 1;
  public static readonly ANONYMOUS_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Enforces monthly link creation quota based on the user's subscription tier.
   * Free: 10 links/mo | Pro: 100 links/mo | Agency: 1,000 links/mo
   */
  public static async checkUserMonthlyQuota(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const tier = user?.plan || 'FREE';
    const limit = tier === 'AGENCY' ? 1000 : tier === 'PRO' ? 100 : this.MAX_MONTHLY_LINKS_PER_USER;

    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const count = await prisma.link.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
    });

    if (count >= limit) {
      throw new RateLimitError(
        `Monthly quota reached (${limit} links on ${tier} plan). Please upgrade your subscription to unlock more links.`,
      );
    }

    return count;
  }

  /**
   * Retrieves remaining quota for a user in the current calendar month.
   */
  public static async getUserQuota(userId: string): Promise<{ used: number; total: number; tier: string; resetAt: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const tier = user?.plan || 'FREE';
    const limit = tier === 'AGENCY' ? 1000 : tier === 'PRO' ? 100 : this.MAX_MONTHLY_LINKS_PER_USER;

    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const used = await prisma.link.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
    });

    return {
      used,
      total: limit,
      tier,
      resetAt: nextMonth.toISOString(),
    };
  }

  /**
   * Creates a public short link for an unauthenticated visitor.
   * Strictly limited to 1 link per IP (24h window). Custom aliases and expiration are disallowed.
   */
  public static async createAnonymousLink(ip: string, destinationUrl: string): Promise<LinkDto> {
    // Check anonymous IP rate limit
    const now = Date.now();
    const lastCreated = anonymousIpUsage.get(ip);

    // Evict stale entries older than 24h when cache grows to prevent memory bloat
    if (anonymousIpUsage.size > 500) {
      const cutoff = now - this.ANONYMOUS_WINDOW_MS;
      for (const [recordedIp, timestamp] of anonymousIpUsage.entries()) {
        if (timestamp < cutoff) {
          anonymousIpUsage.delete(recordedIp);
        }
      }
    }

    if (lastCreated && now - lastCreated < this.ANONYMOUS_WINDOW_MS) {
      throw new RateLimitError(
        'You have reached the free anonymous limit (1 link). Create a free account to unlock 10 links per month, custom aliases, and analytics!',
      );
    }

    const validatedDestination = validateSafeDestinationUrl(destinationUrl);

    // Collision retry loop
    const MAX_COLLISION_RETRIES = 5;
    let attempts = 0;

    while (attempts < MAX_COLLISION_RETRIES) {
      attempts++;
      const generatedCode = generateShortCode();

      try {
        const link = await prisma.link.create({
          data: {
            userId: null,
            destinationUrl: validatedDestination,
            code: generatedCode,
            isActive: true,
            expiresAt: null,
          },
        });

        // Invalidate any potential negative cache entry
        redirectCache.invalidate(generatedCode);

        // Record IP usage
        anonymousIpUsage.set(ip, now);
        return this.mapToDto(link);
      } catch (error: unknown) {
        const prismaErr = error as { code?: string };
        if (prismaErr.code === 'P2002') {
          logger.warn(
            { attempts, code: generatedCode },
            'Collision detected on generated anonymous code. Retrying...',
          );
          continue;
        }
        throw error;
      }
    }

    throw new ConflictError('Unable to allocate a unique short code. Please try again.');
  }

  /**
   * Claims previously anonymous links and associates them with the authenticated user.
   */
  public static async claimAnonymousLinks(userId: string, linkIds: string[]): Promise<{ claimedCount: number }> {
    if (!linkIds || linkIds.length === 0) {
      return { claimedCount: 0 };
    }

    // Filter valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validIds = linkIds.filter((id) => uuidRegex.test(id)).slice(0, 10);

    if (validIds.length === 0) {
      return { claimedCount: 0 };
    }

    // Enforce monthly quota before claiming links
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    const tier = user?.plan || 'FREE';
    const limit = tier === 'AGENCY' ? 1000 : tier === 'PRO' ? 100 : this.MAX_MONTHLY_LINKS_PER_USER;

    const currentUsage = await this.checkUserMonthlyQuota(userId);
    const remainingQuota = Math.max(0, limit - currentUsage);

    if (remainingQuota <= 0) {
      throw new RateLimitError(
        `Monthly quota reached (${limit} links per month on ${tier} plan). You cannot claim more links this month.`,
      );
    }

    const claimableIds = validIds.slice(0, remainingQuota);

    const updated = await prisma.link.updateMany({
      where: {
        id: { in: claimableIds },
        userId: null,
      },
      data: {
        userId,
      },
    });

    return { claimedCount: updated.count };
  }

  /**
   * Creates a new short link with either a validated custom alias or an unbiased Base62 short code.
   * Employs a bounded retry loop for generated code collisions and enforces 10 links/month quota.
   */
  public static async createLink(userId: string, input: CreateLinkInput): Promise<LinkDto> {
    // Enforce 10 links per month limit
    await this.checkUserMonthlyQuota(userId);
    const validatedDestination = validateSafeDestinationUrl(input.destinationUrl);
    const finalDestination = appendUtmParameters(validatedDestination, input);
    const expiresAtDate = input.expiresAt ? new Date(input.expiresAt) : null;

    let assignedDomain: { id: string; hostname: string } | null = null;
    if (input.customDomainId) {
      const domain = await prisma.customDomain.findFirst({
        where: {
          id: input.customDomainId,
          userId,
          status: { in: ['ACTIVE', 'VERIFIED'] },
        },
        select: { id: true, hostname: true },
      });
      if (!domain) {
        throw new BadRequestError('The selected custom domain is not active or verified for your account');
      }
      assignedDomain = domain;
    }

    // Custom Alias Flow
    if (input.customAlias && input.customAlias.trim().length > 0) {
      const validatedAlias = validateCustomAlias(input.customAlias);

      // Check if alias is already taken
      const existing = await prisma.link.findUnique({
        where: { code: validatedAlias },
      });

      if (existing) {
        throw new ConflictError('The requested custom alias is already in use');
      }

      const link = await prisma.link.create({
        data: {
          userId,
          customDomainId: assignedDomain?.id || null,
          destinationUrl: finalDestination,
          code: validatedAlias,
          isActive: true,
          expiresAt: expiresAtDate,
          utmSource: input.utmSource?.trim() || null,
          utmMedium: input.utmMedium?.trim() || null,
          utmCampaign: input.utmCampaign?.trim() || null,
          utmTerm: input.utmTerm?.trim() || null,
          utmContent: input.utmContent?.trim() || null,
        },
        include: {
          customDomain: { select: { id: true, hostname: true } },
        },
      });

      // Invalidate any potential negative cache entry for this alias
      redirectCache.invalidate(validatedAlias);

      return this.mapToDto(link);
    }

    // Auto-Generated Base62 Short Code Flow with Collision Retry
    const MAX_COLLISION_RETRIES = 5;
    let attempts = 0;

    while (attempts < MAX_COLLISION_RETRIES) {
      attempts++;
      const generatedCode = generateShortCode();

      try {
        const link = await prisma.link.create({
          data: {
            userId,
            customDomainId: assignedDomain?.id || null,
            destinationUrl: finalDestination,
            code: generatedCode,
            isActive: true,
            expiresAt: expiresAtDate,
            utmSource: input.utmSource?.trim() || null,
            utmMedium: input.utmMedium?.trim() || null,
            utmCampaign: input.utmCampaign?.trim() || null,
            utmTerm: input.utmTerm?.trim() || null,
            utmContent: input.utmContent?.trim() || null,
          },
          include: {
            customDomain: { select: { id: true, hostname: true } },
          },
        });

        // Invalidate any potential negative cache entry
        redirectCache.invalidate(generatedCode);

        return this.mapToDto(link);
      } catch (error: unknown) {
        const prismaErr = error as { code?: string };
        if (prismaErr.code === 'P2002') {
          logger.warn(
            { attempts, code: generatedCode },
            'Collision detected on generated short code. Retrying...',
          );
          continue;
        }
        throw error;
      }
    }

    throw new ConflictError('Unable to allocate a unique short code. Please try again.');
  }

  /**
   * Retrieves a paginated list of links owned exclusively by the authenticated user.
   */
  public static async listUserLinks(
    userId: string,
    query: PaginationQueryInput,
  ): Promise<{ data: LinkDto[]; meta: PaginatedMeta }> {
    const { page, limit, search, status } = query;
    const skip = (page - 1) * limit;

    // Construct scoped where clause
    const whereClause: Record<string, unknown> = {
      userId,
    };

    // Apply search filter (code or destination)
    if (search && search.trim().length > 0) {
      whereClause.OR = [
        { code: { contains: search.trim(), mode: 'insensitive' } },
        { destinationUrl: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Apply status filter
    const now = new Date();
    if (status === 'active') {
      whereClause.isActive = true;
      whereClause.OR = [{ expiresAt: null }, { expiresAt: { gt: now } }];
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    } else if (status === 'expired') {
      whereClause.expiresAt = { lte: now };
    }

    const [totalItems, links] = await Promise.all([
      prisma.link.count({ where: whereClause }),
      prisma.link.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customDomain: {
            select: { id: true, hostname: true },
          },
          _count: {
            select: { clickEvents: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      data: links.map((l) => ({
        ...this.mapToDto(l),
        totalClicks: l._count.clickEvents,
      })),
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    };
  }

  /**
   * Retrieves a single link by ID, strictly scoped to the owner ID.
   */
  public static async getLinkById(userId: string, linkId: string): Promise<LinkDto> {
    const link = await prisma.link.findFirst({
      where: {
        id: linkId,
        userId,
      },
      include: {
        customDomain: {
          select: { id: true, hostname: true },
        },
        _count: {
          select: { clickEvents: true },
        },
      },
    });

    if (!link) {
      throw new NotFoundError('Link not found or access unauthorized');
    }

    return {
      ...this.mapToDto(link),
      totalClicks: link._count.clickEvents,
    };
  }

  /**
   * Updates link settings (destination, active status, expiration), strictly scoped to owner.
   */
  public static async updateLink(
    userId: string,
    linkId: string,
    input: UpdateLinkInput,
  ): Promise<LinkDto> {
    // Verify ownership
    const existing = await prisma.link.findFirst({
      where: { id: linkId, userId },
    });

    if (!existing) {
      throw new NotFoundError('Link not found or access unauthorized');
    }

    const updateData: Record<string, unknown> = {};

    const hasUtmUpdate =
      input.utmSource !== undefined ||
      input.utmMedium !== undefined ||
      input.utmCampaign !== undefined ||
      input.utmTerm !== undefined ||
      input.utmContent !== undefined;

    let targetDestination =
      input.destinationUrl !== undefined
        ? validateSafeDestinationUrl(input.destinationUrl)
        : existing.destinationUrl;

    if (hasUtmUpdate || input.destinationUrl !== undefined) {
      targetDestination = appendUtmParameters(targetDestination, {
        utmSource: input.utmSource !== undefined ? input.utmSource : existing.utmSource,
        utmMedium: input.utmMedium !== undefined ? input.utmMedium : existing.utmMedium,
        utmCampaign: input.utmCampaign !== undefined ? input.utmCampaign : existing.utmCampaign,
        utmTerm: input.utmTerm !== undefined ? input.utmTerm : existing.utmTerm,
        utmContent: input.utmContent !== undefined ? input.utmContent : existing.utmContent,
      });
      updateData.destinationUrl = targetDestination;
    }

    if (input.isActive !== undefined) {
      updateData.isActive = input.isActive;
    }

    if (input.expiresAt !== undefined) {
      updateData.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    }

    if (input.utmSource !== undefined) updateData.utmSource = input.utmSource?.trim() || null;
    if (input.utmMedium !== undefined) updateData.utmMedium = input.utmMedium?.trim() || null;
    if (input.utmCampaign !== undefined) updateData.utmCampaign = input.utmCampaign?.trim() || null;
    if (input.utmTerm !== undefined) updateData.utmTerm = input.utmTerm?.trim() || null;
    if (input.utmContent !== undefined) updateData.utmContent = input.utmContent?.trim() || null;

    const updated = await prisma.link.update({
      where: { id: linkId },
      data: updateData,
    });

    // Invalidate in-memory redirect cache so new destination/status takes effect immediately
    redirectCache.invalidate(existing.code);

    return this.mapToDto(updated);
  }

  /**
   * Bulk imports links from CSV or batch JSON array with in-memory collision defense,
   * quota enforcement, and row-level partial success tracking.
   */
  public static async bulkImportLinks(userId: string, input: BulkImportInput): Promise<BulkImportResultDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    const tier = user?.plan || 'FREE';
    const limit = tier === 'AGENCY' ? 1000 : tier === 'PRO' ? 100 : this.MAX_MONTHLY_LINKS_PER_USER;

    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const currentUsage = await prisma.link.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
    });

    const remainingQuota = Math.max(0, limit - currentUsage);
    if (remainingQuota <= 0) {
      throw new RateLimitError(
        `Monthly quota reached (${limit} links on ${tier} plan). Please upgrade your subscription to import more links.`,
      );
    }

    // Pre-fetch user verified domains to validate customDomainId in-memory
    const userDomains = await prisma.customDomain.findMany({
      where: {
        userId,
        status: { in: ['ACTIVE', 'VERIFIED'] },
      },
      select: { id: true, hostname: true },
    });
    const domainMap = new Map<string, { id: string; hostname: string }>();
    for (const d of userDomains) {
      domainMap.set(d.id, d);
    }

    const results: BulkImportRowResult[] = [];
    const allocatedCodes = new Set<string>();
    let createdInBatch = 0;

    // Process rows in bounded chunks of 25 to prevent event loop / connection starvation
    const CHUNK_SIZE = 25;
    const rows = input.rows;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      // Re-evaluate quota before each chunk to prevent concurrent overages
      if (currentUsage + createdInBatch >= limit) {
        for (let j = i; j < rows.length; j++) {
          results.push({
            rowNumber: j + 1,
            destinationUrl: rows[j].destinationUrl,
            status: 'failed',
            error: `Monthly quota of ${limit} links reached for ${tier} tier`,
          });
        }
        break;
      }

      const chunk = rows.slice(i, i + CHUNK_SIZE);

      for (let cIdx = 0; cIdx < chunk.length; cIdx++) {
        const rowIdx = i + cIdx;
        const row = chunk[cIdx];

        if (currentUsage + createdInBatch >= limit) {
          results.push({
            rowNumber: rowIdx + 1,
            destinationUrl: row.destinationUrl,
            status: 'failed',
            error: `Monthly quota of ${limit} links reached for ${tier} tier`,
          });
          continue;
        }

        try {
          const validatedDestination = validateSafeDestinationUrl(row.destinationUrl);
          const finalDestination = appendUtmParameters(validatedDestination, row);

          let domain: { id: string; hostname: string } | null = null;
          if (row.customDomainId) {
            domain = domainMap.get(row.customDomainId) || null;
            if (!domain) {
              throw new BadRequestError('The specified custom domain is not active or verified for your account');
            }
          }

          let allocatedCode = '';

          if (row.customAlias && row.customAlias.trim().length > 0) {
            const alias = validateCustomAlias(row.customAlias);
            if (allocatedCodes.has(alias.toLowerCase())) {
              throw new ConflictError(`Custom alias '${alias}' is duplicated in this batch`);
            }

            const existing = await prisma.link.findUnique({
              where: { code: alias },
              select: { id: true },
            });
            if (existing) {
              throw new ConflictError(`Custom alias '${alias}' is already in use`);
            }

            allocatedCode = alias;
            allocatedCodes.add(alias.toLowerCase());
          } else {
            // Allocate distinct Base62 short code with in-batch collision defense
            let code = '';
            let attempts = 0;
            while (attempts < 5) {
              attempts++;
              const candidate = generateShortCode();
              if (allocatedCodes.has(candidate.toLowerCase())) {
                continue;
              }
              const exists = await prisma.link.findUnique({
                where: { code: candidate },
                select: { id: true },
              });
              if (!exists) {
                code = candidate;
                break;
              }
            }

            if (!code) {
              throw new ConflictError('Unable to allocate unique short code. Please try again.');
            }

            allocatedCode = code;
            allocatedCodes.add(code.toLowerCase());
          }

          await prisma.link.create({
            data: {
              userId,
              customDomainId: domain?.id || null,
              destinationUrl: finalDestination,
              code: allocatedCode,
              isActive: true,
              utmSource: row.utmSource?.trim() || null,
              utmMedium: row.utmMedium?.trim() || null,
              utmCampaign: row.utmCampaign?.trim() || null,
              utmTerm: row.utmTerm?.trim() || null,
              utmContent: row.utmContent?.trim() || null,
            },
            include: {
              customDomain: { select: { id: true, hostname: true } },
            },
          });

          redirectCache.invalidate(allocatedCode);
          createdInBatch++;

          const shortUrl = domain
            ? `https://${domain.hostname}/${allocatedCode}`
            : `${env.APP_BASE_URL}/${allocatedCode}`;

          results.push({
            rowNumber: rowIdx + 1,
            destinationUrl: row.destinationUrl,
            code: allocatedCode,
            shortUrl,
            status: 'success',
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to create short link';
          results.push({
            rowNumber: rowIdx + 1,
            destinationUrl: row.destinationUrl,
            status: 'failed',
            error: message,
          });
        }
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const failureCount = results.length - successCount;

    return {
      totalRows: rows.length,
      successCount,
      failureCount,
      results,
    };
  }

  /**
   * Deletes a link, cascading click events, strictly scoped to owner.
   */
  public static async deleteLink(userId: string, linkId: string): Promise<void> {
    const existing = await prisma.link.findFirst({
      where: { id: linkId, userId },
    });

    if (!existing) {
      throw new NotFoundError('Link not found or access unauthorized');
    }

    await prisma.link.delete({
      where: { id: linkId },
    });

    // Invalidate in-memory redirect cache on deletion
    redirectCache.invalidate(existing.code);
  }

  /**
   * Maps Prisma Link entity to LinkDto with full shortUrl, respecting custom domain if set.
   */
  private static mapToDto(link: {
    id: string;
    userId: string | null;
    code: string;
    destinationUrl: string;
    isActive: boolean;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    customDomainId?: string | null;
    customDomain?: { id: string; hostname: string } | null;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    utmTerm?: string | null;
    utmContent?: string | null;
  }): LinkDto {
    const shortUrl = link.customDomain
      ? `https://${link.customDomain.hostname}/${link.code}`
      : `${env.APP_BASE_URL}/${link.code}`;

    return {
      id: link.id,
      userId: link.userId,
      code: link.code,
      shortUrl,
      destinationUrl: link.destinationUrl,
      isActive: link.isActive,
      expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
      createdAt: link.createdAt.toISOString(),
      updatedAt: link.updatedAt.toISOString(),
      customDomainId: link.customDomainId || (link.customDomain ? link.customDomain.id : null),
      customDomain: link.customDomain || null,
      utmSource: link.utmSource || null,
      utmMedium: link.utmMedium || null,
      utmCampaign: link.utmCampaign || null,
      utmTerm: link.utmTerm || null,
      utmContent: link.utmContent || null,
    };
  }
}
