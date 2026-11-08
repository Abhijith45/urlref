import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api-client';
import { queryKeys } from '../services/query-keys';
import { DashboardOverviewDto } from '@shortener/shared';
import { MousePointerClick, Smartphone, Globe, Compass, BarChart3, Plus, QrCode } from 'lucide-react';
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

export const DashboardAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Analytics Overview — URLRef Softics';
  }, []);

  const { data: overview, isLoading } = useQuery({
    queryKey: queryKeys.analytics.overview(),
    queryFn: async () => {
      const res = await apiClient.get<{ data: DashboardOverviewDto }>(
        '/api/v1/analytics/overview',
      );
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  const deviceData = overview?.deviceDistribution.map((d) => ({
    name: d.deviceType.charAt(0).toUpperCase() + d.deviceType.slice(1),
    value: d.clicks,
  })) || [];

  const totalClicks = overview?.totalClicks ?? 0;
  const totalLinks = overview?.totalLinks ?? 0;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: '#1C2411' }}>
            Overall analytics
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Portfolio wide performance across all your links.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            icon={<BarChart3 size={16} />}
            label={`${totalLinks} Total Links`}
            variant="outlined"
            sx={{ fontWeight: 600, fontFamily: 'Geist Mono, monospace' }}
          />
          <Chip
            icon={<MousePointerClick size={16} />}
            label={`${totalClicks} Total Clicks`}
            color="primary"
            sx={{ fontWeight: 700, fontFamily: 'Geist Mono, monospace' }}
          />
        </Box>
      </Box>

      {/* Zero Click / Empty State Guide for high retention */}
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
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: 'rgba(88, 117, 41, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <MousePointerClick size={28} color="#587529" />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1C2411' }}>
            No clicks recorded across your links yet
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 540, mx: 'auto', mb: 3, lineHeight: 1.6 }}>
            Your links are active! Share them across social media, email newsletters, or print dynamic QR codes to start tracking real time clicks, devices, referrers, and country locations.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              disableElevation
              disableRipple
              startIcon={<Plus size={16} />}
              onClick={() => navigate('/dashboard/links')}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Create short link
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
          </Box>
        </Card>
      )}

      {/* Clicks Over Time Area Chart */}
      <Card sx={{ mb: 4, p: 1, border: '1px solid #E4E9DC', borderRadius: 3, boxShadow: 'none' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1C2411' }}>
            Aggregate clicks over time (last 30 days)
          </Typography>
          {overview?.clicksOverTime && overview.clicksOverTime.length > 0 ? (
            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overview.clicksOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOverallClicks" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#colorOverallClicks)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No clicks recorded across your links yet.
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
                  Aggregate device share
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
              {overview?.trafficSources && overview.trafficSources.length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E4E9DC' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Referrer domain</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Clicks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {overview.trafficSources.map((source) => (
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
                    No referrer data recorded yet.
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
                  Global visitor countries
                </Typography>
              </Box>
              {overview?.geographicDistribution && overview.geographicDistribution.length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E4E9DC' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Country code</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Clicks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {overview.geographicDistribution.map((geo) => (
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
                    No geographic data recorded yet.
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
