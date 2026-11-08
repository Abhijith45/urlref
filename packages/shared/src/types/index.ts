import { DeviceType, ErrorCode } from '../constants';

export type UserRole = 'USER' | 'ADMIN';
export type SubscriptionTier = 'FREE' | 'PRO' | 'AGENCY';
export type BillingInterval = 'month' | 'year';

export interface TierLimits {
  maxLinksPerMonth: number;
  maxCustomDomains: number;
  dynamicQrAllowed: boolean;
  analyticsRetentionDays: number;
}

export interface SubscriptionStatusDto {
  tier: SubscriptionTier;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  limits: TierLimits;
  usage: {
    linksCreatedThisMonth: number;
    customDomainsCount: number;
  };
}

export interface CreateCheckoutSessionDto {
  tier: 'PRO' | 'AGENCY';
  interval: BillingInterval;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResult {
  url: string;
}

export interface CustomerPortalResult {
  url: string;
}

export interface UserDto {
  id: string;
  email: string;
  role: UserRole;
  plan?: SubscriptionTier;
  createdAt: string;
}

export interface LinkDto {
  id: string;
  userId: string | null;
  workspaceId?: string | null;
  code: string;
  title?: string | null;
  shortUrl: string;
  destinationUrl: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  totalClicks?: number;
  customDomainId?: string | null;
  customDomain?: {
    id: string;
    hostname: string;
  } | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
}

export interface BulkImportRowResult {
  rowNumber: number;
  destinationUrl: string;
  code?: string;
  shortUrl?: string;
  status: 'success' | 'failed';
  error?: string;
}

export interface BulkImportResultDto {
  totalRows: number;
  successCount: number;
  failureCount: number;
  results: BulkImportRowResult[];
}

export interface ClickEventDto {
  id: string;
  linkId: string;
  clickedAt: string;
  referrer?: string | null;
  deviceType?: DeviceType | null;
  countryCode?: string | null;
}

export interface ClickSeriesItem {
  date: string;
  clicks: number;
}

export interface TrafficSourceItem {
  referrer: string;
  clicks: number;
}

export interface DeviceDistributionItem {
  deviceType: DeviceType | string;
  clicks: number;
}

export interface GeographicDistributionItem {
  countryCode: string;
  clicks: number;
}

export interface LinkAnalyticsDto {
  linkId: string;
  totalClicks: number;
  series: ClickSeriesItem[];
  trafficSources: TrafficSourceItem[];
  deviceDistribution: DeviceDistributionItem[];
  geographicDistribution: GeographicDistributionItem[];
}

export interface DashboardOverviewDto {
  totalLinks: number;
  totalClicks: number;
  clicksOverTime: ClickSeriesItem[];
  trafficSources: TrafficSourceItem[];
  deviceDistribution: DeviceDistributionItem[];
  geographicDistribution: GeographicDistributionItem[];
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  data: T;
  meta?: PaginatedMeta | Record<string, unknown>;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
}

export interface ApiError {
  error: {
    code: ErrorCode | string;
    message: string;
    details?: ValidationErrorDetail[];
    requestId?: string;
  };
}

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface WorkspaceMemberDto {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
  user: {
    id: string;
    email: string;
  };
}

export interface WorkspaceInviteDto {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface WorkspaceDto {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: SubscriptionTier;
  role: WorkspaceRole;
  membersCount?: number;
  createdAt: string;
  updatedAt: string;
}

