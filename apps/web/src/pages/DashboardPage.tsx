import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Link2,
  MousePointerClick,
  CheckCircle2,
  Copy,
  Check,
  BarChart2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import { queryKeys } from '../services/query-keys';
import { QuickShortenWidget } from '../components/links/QuickShortenWidget';
import { LinkDto, DashboardOverviewDto } from '@shortener/shared';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
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
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 1 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
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
          <Card sx={{ p: 1, border: '1px solid #E4E9DC', borderRadius: 3, boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
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
          <Card sx={{ p: 1, border: '1px solid #E4E9DC', borderRadius: 3, boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
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
      <Card sx={{ p: 1 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2.5,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Recent Links
            </Typography>
            <Button
              endIcon={<ArrowRight size={16} />}
              disableElevation
              disableRipple
              onClick={() => navigate('/dashboard/links')}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              View all links
            </Button>
          </Box>

          {linksLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : !linksData?.data || linksData.data.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No short links created yet. Use the widget above to create your first link!
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E4E9DC' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Short link</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Original destination</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Clicks</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {linksData.data.map((link) => (
                    <TableRow key={link.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', fontFamily: 'Geist Mono, monospace' }}>
                            /{link.code}
                          </Typography>
                          <Tooltip title={copiedId === link.id ? 'Copied!' : 'Copy'}>
                            <IconButton
                              size="small"
                              disableRipple
                              onClick={() => handleCopy(link.id, link.shortUrl)}
                            >
                              {copiedId === link.id ? (
                                <Check size={14} color="#71951E" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {link.destinationUrl}
                          </span>
                          <a
                            href={link.destinationUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#64748b', display: 'flex' }}
                          >
                            <ExternalLink size={12} />
                          </a>
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${link.totalClicks ?? 0} clicks`}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={link.isActive ? 'Active' : 'Disabled'}
                          size="small"
                          color={link.isActive ? 'success' : 'default'}
                          sx={{ fontSize: '0.75rem', height: 22 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          disableElevation
                          disableRipple
                          startIcon={<BarChart2 size={14} />}
                          onClick={() => navigate(`/dashboard/analytics/${link.id}`)}
                          sx={{ fontSize: '0.8rem', textTransform: 'none' }}
                        >
                          Stats
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
