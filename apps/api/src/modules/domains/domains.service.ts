import crypto from 'crypto';
import { prisma } from '../../database/db';
import { verifyDnsRecords, DnsVerificationResult } from './dns-verifier';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../errors/app-error';
import { TIER_LIMITS } from '../billing/billing.service';
import {
  CreateDomainInput,
  CustomDomainDto,
  UpdateDomainInput,
} from '@shortener/shared';
import { CustomDomain, PlanTier } from '@prisma/client';

export class DomainsService {
  /**
   * Enforces custom domain tier allowances.
   * FREE: 0 | PRO: 1 | AGENCY: 5
   */
  private static async checkDomainQuota(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const tier = (user?.plan || 'FREE') as PlanTier;
    const allowedLimit = TIER_LIMITS[tier]?.maxCustomDomains ?? 0;

    if (allowedLimit <= 0) {
      throw new ForbiddenError(
        'Custom branded domains are an exclusive feature of Pro (1 domain) and Agency (5 domains) plans. Please upgrade your subscription to connect your domain.',
      );
    }

    const currentDomainCount = await prisma.customDomain.count({
      where: { userId },
    });

    if (currentDomainCount >= allowedLimit) {
      throw new ForbiddenError(
        `You have reached the maximum allowed custom domains (${allowedLimit} domain${
          allowedLimit > 1 ? 's' : ''
        }) on your ${tier} plan.`,
      );
    }
  }

  /**
   * Registers a new custom domain for verification.
   */
  public static async createDomain(
    userId: string,
    input: CreateDomainInput,
  ): Promise<CustomDomainDto> {
    await this.checkDomainQuota(userId);

    const cleanHostname = input.hostname.trim().toLowerCase();

    // Check if domain is already claimed by any user
    const existing = await prisma.customDomain.findUnique({
      where: { hostname: cleanHostname },
    });

    if (existing) {
      throw new ConflictError(
        'This domain is already registered in the system. If you own this domain, contact support.',
      );
    }

    const verificationToken = crypto.randomBytes(16).toString('hex');
    const cnameTarget = 'cname.urlref.softics.in';

    const domain = await prisma.customDomain.create({
      data: {
        userId,
        hostname: cleanHostname,
        status: 'PENDING',
        verificationToken,
        cnameTarget,
        sslStatus: 'pending_validation',
        custom404Url: input.custom404Url?.trim() ? input.custom404Url.trim() : null,
      },
    });

    return this.mapToDto(domain);
  }

  /**
   * Retrieves all custom domains owned by the authenticated user.
   */
  public static async listDomains(userId: string): Promise<CustomDomainDto[]> {
    const domains = await prisma.customDomain.findMany({
      where: { userId },
      include: {
        _count: {
          select: { links: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return domains.map((d) => ({
      ...this.mapToDto(d),
      linksCount: d._count.links,
    }));
  }

  /**
   * Retrieves a single domain by ID, ensuring ownership.
   */
  public static async getDomain(userId: string, domainId: string): Promise<CustomDomainDto> {
    const domain = await prisma.customDomain.findFirst({
      where: { id: domainId, userId },
      include: {
        _count: {
          select: { links: true },
        },
      },
    });

    if (!domain) {
      throw new NotFoundError('Custom domain not found or you do not have permission to access it');
    }

    return {
      ...this.mapToDto(domain),
      linksCount: domain._count.links,
    };
  }

  /**
   * Triggers DNS resolution check to verify domain ownership.
   */
  public static async verifyDomain(
    userId: string,
    domainId: string,
  ): Promise<{ domain: CustomDomainDto; verification: DnsVerificationResult }> {
    const domain = await prisma.customDomain.findFirst({
      where: { id: domainId, userId },
    });

    if (!domain) {
      throw new NotFoundError('Custom domain not found');
    }

    const verificationResult = await verifyDnsRecords(
      domain.hostname,
      domain.verificationToken,
      domain.cnameTarget,
    );

    let updatedDomain = domain;

    if (verificationResult.verified) {
      updatedDomain = await prisma.customDomain.update({
        where: { id: domain.id },
        data: {
          status: 'ACTIVE',
          sslStatus: 'active',
        },
      });
    }

    return {
      domain: this.mapToDto(updatedDomain),
      verification: verificationResult,
    };
  }

  /**
   * Updates domain configuration (such as custom 404 URL).
   */
  public static async updateDomain(
    userId: string,
    domainId: string,
    input: UpdateDomainInput,
  ): Promise<CustomDomainDto> {
    const domain = await prisma.customDomain.findFirst({
      where: { id: domainId, userId },
    });

    if (!domain) {
      throw new NotFoundError('Custom domain not found');
    }

    const updated = await prisma.customDomain.update({
      where: { id: domain.id },
      data: {
        custom404Url: input.custom404Url !== undefined ? input.custom404Url : domain.custom404Url,
      },
    });

    return this.mapToDto(updated);
  }

  /**
   * Deletes a custom domain. Associated links will have customDomainId set to null.
   */
  public static async deleteDomain(userId: string, domainId: string): Promise<void> {
    const domain = await prisma.customDomain.findFirst({
      where: { id: domainId, userId },
    });

    if (!domain) {
      throw new NotFoundError('Custom domain not found');
    }

    await prisma.customDomain.delete({
      where: { id: domain.id },
    });
  }

  private static mapToDto(domain: CustomDomain): CustomDomainDto {
    return {
      id: domain.id,
      hostname: domain.hostname,
      status: domain.status as CustomDomainDto['status'],
      verificationToken: domain.verificationToken,
      cnameTarget: domain.cnameTarget,
      sslStatus: domain.sslStatus,
      custom404Url: domain.custom404Url,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}
