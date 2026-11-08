import { prisma } from '../../database/db';
import { logger } from '../../utils/logger';

export interface ExportableClickEvent {
  clickedAt: Date;
  link: {
    code: string;
    destinationUrl: string;
  };
  referrer: string | null;
  deviceType: string | null;
  countryCode: string | null;
}

export class AnalyticsRetentionService {
  public static readonly RETENTION_DAYS = 30;
  public static readonly CHUNK_SIZE = 5000;

  /**
   * Sanitizes a cell for CSV export to prevent formula injection attacks (CWE-1236).
   * Neutralizes cells starting with '=', '+', '-', '@', '\t', or '\r'.
   */
  public static sanitizeCsvCell(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
      return '""';
    }

    let str = String(value).trim();

    // Neutralize formula characters if present at the start
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }

    // Escape quotes per RFC 4180
    return `"${str.replace(/"/g, '""')}"`;
  }

  /**
   * Builds an RFC 4180 compliant CSV string from an array of click events.
   */
  public static buildCsvReport(events: ExportableClickEvent[]): string {
    const headers = [
      'Clicked At (UTC)',
      'Link Code',
      'Destination URL',
      'Referrer',
      'Device Type',
      'Country Code',
    ];

    const rows: string[] = [headers.join(',')];

    for (const evt of events) {
      const row = [
        this.sanitizeCsvCell(evt.clickedAt.toISOString()),
        this.sanitizeCsvCell(evt.link.code),
        this.sanitizeCsvCell(evt.link.destinationUrl),
        this.sanitizeCsvCell(evt.referrer || 'direct'),
        this.sanitizeCsvCell(evt.deviceType || 'desktop'),
        this.sanitizeCsvCell(evt.countryCode || 'N/A'),
      ];
      rows.push(row.join(','));
    }

    return rows.join('\r\n');
  }

  /**
   * Purges click events older than 30 days in bounded chunks of 5,000 items.
   * Yields execution between chunks to avoid locking PostgreSQL and starvation of redirect traffic.
   */
  public static async pruneStaleClickEvents(): Promise<number> {
    const cutoff = new Date(Date.now() - this.RETENTION_DAYS * 24 * 60 * 60 * 1000);
    let totalPruned = 0;

    try {
      while (true) {
        const staleRecords = await prisma.clickEvent.findMany({
          where: { clickedAt: { lt: cutoff } },
          select: { id: true },
          take: this.CHUNK_SIZE,
        });

        if (staleRecords.length === 0) {
          break;
        }

        const ids = staleRecords.map((r) => r.id);
        const { count } = await prisma.clickEvent.deleteMany({
          where: { id: { in: ids } },
        });

        totalPruned += count;

        if (staleRecords.length < this.CHUNK_SIZE) {
          break;
        }

        // Brief 100ms pause to yield event loop & release database lock queue
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (totalPruned > 0) {
        logger.info(
          { totalPruned, retentionDays: this.RETENTION_DAYS },
          'Analytics 30-day retention pruning completed successfully',
        );
      }
    } catch (error) {
      logger.error({ error }, 'Error occurred during analytics 30-day retention pruning');
    }

    return totalPruned;
  }
}
