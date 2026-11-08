import { prisma } from '../../database/db';
import { NotFoundError } from '../../errors/app-error';
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

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const events = await prisma.clickEvent.findMany({
      where: {
        linkId,
        clickedAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: {
        clickedAt: true,
        referrer: true,
        deviceType: true,
        countryCode: true,
      },
      orderBy: { clickedAt: 'asc' },
    });

    return {
      linkId,
      totalClicks: events.length,
      series: this.aggregateTimeSeries(events),
      trafficSources: this.aggregateTrafficSources(events),
      deviceDistribution: this.aggregateDevices(events),
      geographicDistribution: this.aggregateCountries(events),
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
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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

    const events = await prisma.clickEvent.findMany({
      where: {
        linkId: { in: linkIds },
        clickedAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: {
        clickedAt: true,
        referrer: true,
        deviceType: true,
        countryCode: true,
      },
      orderBy: { clickedAt: 'asc' },
    });

    return {
      totalLinks,
      totalClicks: events.length,
      clicksOverTime: this.aggregateTimeSeries(events),
      trafficSources: this.aggregateTrafficSources(events),
      deviceDistribution: this.aggregateDevices(events),
      geographicDistribution: this.aggregateCountries(events),
    };
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

  private static aggregateTrafficSources(
    events: Array<{ referrer: string | null }>,
  ): TrafficSourceItem[] {
    const map = new Map<string, number>();

    for (const event of events) {
      const source = event.referrer || 'direct';
      map.set(source, (map.get(source) || 0) + 1);
    }

    return Array.from(map.entries())
      .map(([referrer, clicks]) => ({ referrer, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);
  }

  private static aggregateDevices(
    events: Array<{ deviceType: string | null }>,
  ): DeviceDistributionItem[] {
    const map = new Map<string, number>();

    for (const event of events) {
      const dev = event.deviceType || 'desktop';
      map.set(dev, (map.get(dev) || 0) + 1);
    }

    return Array.from(map.entries()).map(([deviceType, clicks]) => ({
      deviceType,
      clicks,
    }));
  }

  private static aggregateCountries(
    events: Array<{ countryCode: string | null }>,
  ): GeographicDistributionItem[] {
    const map = new Map<string, number>();

    for (const event of events) {
      if (event.countryCode) {
        map.set(event.countryCode, (map.get(event.countryCode) || 0) + 1);
      }
    }

    return Array.from(map.entries())
      .map(([countryCode, clicks]) => ({ countryCode, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);
  }
}
