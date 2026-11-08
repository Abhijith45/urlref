export interface UtmParams {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
}

/**
 * Safely appends UTM parameters to a destination URL using the standard WHATWG URL parser.
 * Preserves existing search parameters, ports, and hash fragments.
 */
export function appendUtmParameters(destinationUrl: string, utm?: UtmParams): string {
  if (!utm) {
    return destinationUrl;
  }

  const { utmSource, utmMedium, utmCampaign, utmTerm, utmContent } = utm;

  const hasAnyUtm = Boolean(
    (utmSource && utmSource.trim()) ||
    (utmMedium && utmMedium.trim()) ||
    (utmCampaign && utmCampaign.trim()) ||
    (utmTerm && utmTerm.trim()) ||
    (utmContent && utmContent.trim())
  );

  if (!hasAnyUtm) {
    return destinationUrl;
  }

  try {
    const parsed = new URL(destinationUrl);

    if (utmSource && utmSource.trim()) {
      parsed.searchParams.set('utm_source', utmSource.trim());
    }
    if (utmMedium && utmMedium.trim()) {
      parsed.searchParams.set('utm_medium', utmMedium.trim());
    }
    if (utmCampaign && utmCampaign.trim()) {
      parsed.searchParams.set('utm_campaign', utmCampaign.trim());
    }
    if (utmTerm && utmTerm.trim()) {
      parsed.searchParams.set('utm_term', utmTerm.trim());
    }
    if (utmContent && utmContent.trim()) {
      parsed.searchParams.set('utm_content', utmContent.trim());
    }

    return parsed.toString();
  } catch {
    // If destinationUrl cannot be parsed by WHATWG parser, return as is
    return destinationUrl;
  }
}
