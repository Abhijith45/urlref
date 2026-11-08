import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Link2, MousePointerClick, CheckCircle2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import { queryKeys } from '../services/query-keys';
import { QuickShortenWidget } from '../components/links/QuickShortenWidget';
import { RecentLinksTable } from '../components/dashboard/RecentLinksTable';
import { LinkDto, DashboardOverviewDto } from '@shortener/shared';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

export const DashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const billingStatus = searchParams.get('billing');

  // Immediately refresh quota and link data upon returning from successful checkout
  useEffect(() => {
    document.title = 'Dashboard Overview — URLRef Softics';
    if (billingStatus === 'success') {
      queryClient.invalidateQueries({ queryKey: queryKeys.links.all });
      queryClient.invalidateQueries({ queryKey: ['links', 'quota'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    }
  }, [billingStatus, queryClient]);

  // Fetch recent links
  const { data: linksData, isLoading: linksLoading } = useQuery({
    queryKey: queryKeys.links.list({ page: 1, limit: 5 }),
    queryFn: async () => {
      const res = await apiClient.get<{ data: LinkDto[]; meta: { total: number } }>(
        '/api/v1/links?page=1&limit=5',
      );
      return res.data;
    },
  });

  // Fetch dashboard overview stats
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: queryKeys.analytics.overview(),
    queryFn: async () => {
      const res = await apiClient.get<{ data: DashboardOverviewDto }>(
        '/api/v1/analytics/overview',
      );
      return res.data.data;
    },
  });

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLinkCreated = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.links.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
  };

  const totalLinks = overviewData?.totalLinks ?? linksData?.meta?.total ?? 0;
  const totalClicks = overviewData?.totalClicks ?? 0;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Dashboard Overview
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Shorten URLs, track real time click volume, and monitor traffic sources.
        </Typography>
      </Box>

      {/* Stripe Checkout Notification Banners */}
      {billingStatus === 'success' && (
        <Alert
          severity="success"
          sx={{
            mb: 4,
            borderRadius: 2.5,
            border: '1px solid #71951E',
            bgcolor: 'rgba(113, 149, 30, 0.1)',
            color: '#1C2411',
            fontWeight: 600,
          }}
        >
          Payment successful! Your subscription is active, and higher quotas have been unlocked.
        </Alert>
      )}

      {billingStatus === 'cancel' && (
        <Alert
          severity="info"
          sx={{
            mb: 4,
            borderRadius: 2.5,
            border: '1px solid #E4E9DC',
            bgcolor: '#FBFBFA',
            color: '#556345',
          }}
        >
          Checkout session cancelled. You can upgrade anytime when you need higher limits.
        </Alert>
      )}

      {/* Top Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 1, border: '1px solid #E4E9DC', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(88, 117, 41, 0.12)',
                  color: 'primary.main',
                }}
              >
                <Link2 size={24} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Total links
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Geist Mono, monospace', color: '#1C2411' }}>
                  {overviewLoading ? <CircularProgress size={20} /> : totalLinks}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 1, border: '1px solid #E4E9DC', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  color: 'success.main',
                }}
              >
                <MousePointerClick size={24} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Total clicks
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Geist Mono, monospace', color: '#1C2411' }}>
                  {overviewLoading ? <CircularProgress size={20} /> : totalClicks}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 1, border: '1px solid #E4E9DC', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(245, 158, 11, 0.1)',
                  color: 'warning.main',
                }}
              >
                <CheckCircle2 size={24} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Redirect health
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#587529' }}>
                  100% Operational
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Shorten Bar */}
      <QuickShortenWidget onLinkCreated={handleLinkCreated} />

      {/* Recent Links Section */}
      <RecentLinksTable
        links={linksData?.data || []}
        isLoading={linksLoading}
        copiedId={copiedId}
        onCopy={(link) => handleCopy(link.id, link.shortUrl)}
      />
    </Box>
  );
};
