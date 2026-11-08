import { prisma } from '../../database/db';
import { NotFoundError } from '../../errors/app-error';
import { AnalyticsRetentionService } from './analytics-retention.service';
import {
  ClickSeriesItem,
  DashboardOverviewDto,
  DeviceDistributionItem,
  GeographicDistributionItem,
  LinkAnalyticsDto,
  TrafficSourceItem,
} from '@shortener/shared';

export class AnalyticsService {
  /**
   * Retrieves analytics for a specific link, strictly scoped to the owner ID.
   */
  public static async getLinkAnalytics(
    userId: string,
    linkId: string,
    from?: string,
    to?: string,
  ): Promise<LinkAnalyticsDto> {
    // Verify ownership
    const link = await prisma.link.findFirst({
      where: { id: linkId, userId },
      select: { id: true },
    });

    if (!link) {
      throw new NotFoundError('Link not found or access unauthorized');
    }

    const retentionCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fromDate = from
      ? new Date(Math.max(new Date(from).getTime(), retentionCutoff.getTime()))
      : retentionCutoff;
    const toDate = to ? new Date(to) : new Date();

    const whereClause = {
      linkId,
      clickedAt: {
        gte: fromDate,
        lte: toDate,
      },
    };

    // Parallel database aggregations keep heap memory bounded and prevent OOM container crashes
    const [totalClicks, deviceGroups, referrerGroups, countryGroups, timeSeriesEvents] =
      await Promise.all([
        prisma.clickEvent.count({ where: whereClause }),
        prisma.clickEvent.groupBy({
          by: ['deviceType'],
          where: whereClause,
          _count: { id: true },
        }),
        prisma.clickEvent.groupBy({
          by: ['referrer'],
          where: whereClause,
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
        prisma.clickEvent.groupBy({
          by: ['countryCode'],
          where: { ...whereClause, countryCode: { not: null } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
        prisma.clickEvent.findMany({
          where: whereClause,
          select: { clickedAt: true },
          orderBy: { clickedAt: 'asc' },
        }),
      ]);

    const deviceDistribution: DeviceDistributionItem[] = deviceGroups.map((g) => ({
      deviceType: g.deviceType || 'desktop',
      clicks: g._count.id,
    }));

    const trafficSources: TrafficSourceItem[] = referrerGroups.map((g) => ({
      referrer: g.referrer || 'direct',
      clicks: g._count.id,
    }));

    const geographicDistribution: GeographicDistributionItem[] = countryGroups
      .filter((g) => g.countryCode !== null)
      .map((g) => ({
        countryCode: g.countryCode as string,
        clicks: g._count.id,
      }));

    return {
      linkId,
      totalClicks,
      series: this.aggregateTimeSeries(timeSeriesEvents),
      trafficSources,
      deviceDistribution,
      geographicDistribution,
    };
  }

  /**
   * Retrieves dashboard overview analytics across all links owned by the user.
   */
  public static async getDashboardOverview(
    userId: string,
    from?: string,
    to?: string,
  ): Promise<DashboardOverviewDto> {
    const retentionCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fromDate = from
      ? new Date(Math.max(new Date(from).getTime(), retentionCutoff.getTime()))
      : retentionCutoff;
    const toDate = to ? new Date(to) : new Date();

    const [totalLinks, userLinks] = await Promise.all([
      prisma.link.count({ where: { userId } }),
      prisma.link.findMany({
        where: { userId },
        select: { id: true },
      }),
    ]);

    const linkIds = userLinks.map((l) => l.id);

    if (linkIds.length === 0) {
      return {
        totalLinks: 0,
        totalClicks: 0,
        clicksOverTime: [],
        trafficSources: [],
        deviceDistribution: [],
        geographicDistribution: [],
      };
    }

    const whereClause = {
      linkId: { in: linkIds },
      clickedAt: {
        gte: fromDate,
        lte: toDate,
      },
    };

    // Parallel database aggregations across user links
    const [totalClicks, deviceGroups, referrerGroups, countryGroups, timeSeriesEvents] =
      await Promise.all([
        prisma.clickEvent.count({ where: whereClause }),
        prisma.clickEvent.groupBy({
          by: ['deviceType'],
          where: whereClause,
          _count: { id: true },
        }),
        prisma.clickEvent.groupBy({
          by: ['referrer'],
          where: whereClause,
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
        prisma.clickEvent.groupBy({
          by: ['countryCode'],
          where: { ...whereClause, countryCode: { not: null } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
        prisma.clickEvent.findMany({
          where: whereClause,
          select: { clickedAt: true },
          orderBy: { clickedAt: 'asc' },
        }),
      ]);

    const deviceDistribution: DeviceDistributionItem[] = deviceGroups.map((g) => ({
      deviceType: g.deviceType || 'desktop',
      clicks: g._count.id,
    }));

    const trafficSources: TrafficSourceItem[] = referrerGroups.map((g) => ({
      referrer: g.referrer || 'direct',
      clicks: g._count.id,
    }));

    const geographicDistribution: GeographicDistributionItem[] = countryGroups
      .filter((g) => g.countryCode !== null)
      .map((g) => ({
        countryCode: g.countryCode as string,
        clicks: g._count.id,
      }));

    return {
      totalLinks,
      totalClicks,
      clicksOverTime: this.aggregateTimeSeries(timeSeriesEvents),
      trafficSources,
      deviceDistribution,
      geographicDistribution,
    };
  }

  /**
   * Generates a 30-day CSV analytics export report for a single link or all links owned by the user.
   */
  public static async exportAnalyticsCsv(
    userId: string,
    linkId?: string,
  ): Promise<{ filename: string; csv: string }> {
    const retentionCutoff = new Date(
      Date.now() - AnalyticsRetentionService.RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );

    let filename = 'urlref_dashboard_analytics_30d.csv';
    let whereClause: any = {
      link: { userId },
      clickedAt: { gte: retentionCutoff },
    };

    if (linkId) {
      const link = await prisma.link.findFirst({
        where: { id: linkId, userId },
        select: { id: true, code: true },
      });

      if (!link) {
        throw new NotFoundError('Link not found or access unauthorized');
      }

      filename = `urlref_${link.code}_analytics_30d.csv`;
      whereClause = {
        linkId,
        clickedAt: { gte: retentionCutoff },
      };
    }

    const events = await prisma.clickEvent.findMany({
      where: whereClause,
      select: {
        clickedAt: true,
        link: {
          select: {
            code: true,
            destinationUrl: true,
          },
        },
        referrer: true,
        deviceType: true,
        countryCode: true,
      },
      orderBy: { clickedAt: 'desc' },
      take: 50000,
    });

    const csv = AnalyticsRetentionService.buildCsvReport(events);
    return { filename, csv };
  }

  private static aggregateTimeSeries(
    events: Array<{ clickedAt: Date }>,
  ): ClickSeriesItem[] {
    const map = new Map<string, number>();

    for (const event of events) {
      const dateKey = event.clickedAt.toISOString().split('T')[0];
      map.set(dateKey, (map.get(dateKey) || 0) + 1);
    }

    return Array.from(map.entries()).map(([date, clicks]) => ({ date, clicks }));
  }
}
