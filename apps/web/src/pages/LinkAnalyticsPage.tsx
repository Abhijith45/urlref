import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Breadcrumbs,
  Link as MuiLink,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Tooltip,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import { queryKeys } from '../services/query-keys';
import { LinkAnalyticsDto, LinkDto } from '@shortener/shared';
import { ArrowLeft, ExternalLink, MousePointerClick, Smartphone, Globe, Compass, Copy, Check, QrCode } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#587529', '#F4BE38', '#71951E', '#EDDA5E', '#8E6210'];

export const LinkAnalyticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Fetch link details
  const { data: linkData } = useQuery({
    queryKey: queryKeys.links.detail(id || ''),
    queryFn: async () => {
      const res = await apiClient.get<{ data: LinkDto }>(`/api/v1/links/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    document.title = linkData
      ? `/${linkData.code} Analytics — URLRef Softics`
      : 'Link Analytics — URLRef Softics';
  }, [linkData]);

  // Fetch analytics for this link
  const { data: analytics, isLoading } = useQuery({
    queryKey: queryKeys.analytics.link(id || ''),
    queryFn: async () => {
      const res = await apiClient.get<{ data: LinkAnalyticsDto }>(`/api/v1/analytics/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const handleCopy = () => {
    if (!linkData) return;
    navigator.clipboard.writeText(linkData.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  const deviceData = analytics?.deviceDistribution.map((d) => ({
    name: d.deviceType.charAt(0).toUpperCase() + d.deviceType.slice(1),
    value: d.clicks,
  })) || [];

  const totalClicks = analytics?.totalClicks ?? 0;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate('/dashboard/links')}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem' }}
        >
          <ArrowLeft size={14} /> Back to links
        </MuiLink>
        <Typography color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
          /{linkData?.code || 'Analytics'}
        </Typography>
      </Breadcrumbs>

      {/* Header Info */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: '#1C2411' }}>
            Link analytics: /{linkData?.code}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
          >
            Redirecting to: <span style={{ fontWeight: 600, color: '#1C2411' }}>{linkData?.destinationUrl}</span>
            {linkData?.destinationUrl && (
              <a href={linkData.destinationUrl} target="_blank" rel="noreferrer" style={{ color: '#587529' }}>
                <ExternalLink size={14} />
              </a>
            )}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {linkData && (
            <Tooltip title={copied ? 'Copied to clipboard!' : 'Copy short link'}>
              <Button
                variant="outlined"
                size="small"
                disableElevation
                disableRipple
                startIcon={copied ? <Check size={14} color="#71951E" /> : <Copy size={14} />}
                onClick={handleCopy}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {copied ? 'Copied' : 'Copy link'}
              </Button>
            </Tooltip>
          )}
          <Chip
            icon={<MousePointerClick size={16} />}
            label={`${totalClicks} Total Clicks`}
            color="primary"
            sx={{ fontWeight: 700, px: 1, fontFamily: 'Geist Mono, monospace' }}
          />
        </Box>
      </Box>

      {/* Zero Clicks Retention Card */}
      {totalClicks === 0 && (
        <Card
          sx={{
            mb: 4,
            p: 3,
            bgcolor: '#ffffff',
            borderRadius: 3,
            border: '1px solid #E4E9DC',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              bgcolor: 'rgba(88, 117, 41, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <MousePointerClick size={24} color="#587529" />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1C2411' }}>
            No clicks recorded for this link yet
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 520, mx: 'auto', mb: 3, lineHeight: 1.6 }}>
            Share your link on WhatsApp, Twitter, LinkedIn, or generate a custom QR code to start tracking visitor engagement and geolocations.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              disableElevation
              disableRipple
              startIcon={<Copy size={16} />}
              onClick={handleCopy}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Copy short link
            </Button>
            <Button
              variant="outlined"
              disableElevation
              disableRipple
              startIcon={<QrCode size={16} />}
              onClick={() => navigate('/dashboard/qr')}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Design QR code
            </Button>
            {linkData && (
              <Button
                variant="text"
                disableElevation
                disableRipple
                startIcon={<ExternalLink size={16} />}
                component="a"
                href={linkData.shortUrl}
                target="_blank"
                rel="noreferrer"
                sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
              >
                Test redirect
              </Button>
            )}
          </Box>
        </Card>
      )}

      {/* Clicks Over Time Area Chart */}
      <Card sx={{ mb: 4, p: 1, border: '1px solid #E4E9DC', borderRadius: 3, boxShadow: 'none' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1C2411' }}>
            Clicks over time (last 30 days)
          </Typography>
          {analytics?.series && analytics.series.length > 0 ? (
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.series} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#587529" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#587529" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E9DC" />
                  <XAxis dataKey="date" stroke="#556345" fontSize={12} tickLine={false} />
                  <YAxis stroke="#556345" fontSize={12} allowDecimals={false} tickLine={false} />
                  <RechartsTooltip />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#587529"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorClicks)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No clicks recorded for this link yet.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Breakdown Grid */}
      <Grid container spacing={3}>
        {/* Device Breakdown */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', p: 1, border: '1px solid #E4E9DC', borderRadius: 3, boxShadow: 'none' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Smartphone size={20} color="#587529" />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1C2411' }}>
                  Device breakdown
                </Typography>
              </Box>
              {deviceData.length > 0 ? (
                <Box sx={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {deviceData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No device data recorded yet.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Traffic Referrers */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', p: 1, border: '1px solid #E4E9DC', borderRadius: 3, boxShadow: 'none' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Compass size={20} color="#587529" />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1C2411' }}>
                  Top traffic sources
                </Typography>
              </Box>
              {analytics?.trafficSources && analytics.trafficSources.length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E4E9DC' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Referrer domain</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Clicks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.trafficSources.map((source) => (
                        <TableRow key={source.referrer}>
                          <TableCell sx={{ fontWeight: 600 }}>{source.referrer}</TableCell>
                          <TableCell align="right">
                            <Chip label={source.clicks} size="small" variant="outlined" sx={{ fontWeight: 600, fontFamily: 'Geist Mono, monospace' }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No referrer data recorded yet (e.g. direct traffic).
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Geographic Breakdown */}
        <Grid item xs={12}>
          <Card sx={{ p: 1, border: '1px solid #E4E9DC', borderRadius: 3, boxShadow: 'none' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Globe size={20} color="#587529" />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1C2411' }}>
                  Geographic distribution (ISO country code)
                </Typography>
              </Box>
              {analytics?.geographicDistribution && analytics.geographicDistribution.length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E4E9DC' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Country code</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Clicks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.geographicDistribution.map((geo) => (
                        <TableRow key={geo.countryCode}>
                          <TableCell sx={{ fontWeight: 600 }}>{geo.countryCode}</TableCell>
                          <TableCell align="right">
                            <Chip label={geo.clicks} size="small" variant="outlined" sx={{ fontWeight: 600, fontFamily: 'Geist Mono, monospace' }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No geographic data available for this link.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
