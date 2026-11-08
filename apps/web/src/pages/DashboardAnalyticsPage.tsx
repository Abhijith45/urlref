import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Button,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api-client';
import { queryKeys } from '../services/query-keys';
import { DashboardOverviewDto } from '@shortener/shared';
import { MousePointerClick, Smartphone, Globe, Compass, BarChart3, Plus, QrCode, Download, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { AnalyticsCard, AnalyticsMetricsCard } from '../components/analytics/AnalyticsShared';

const ClicksAreaChart = lazy(() =>
  import('../components/analytics/AnalyticsCharts').then((m) => ({ default: m.ClicksAreaChart }))
);
const DevicePieChart = lazy(() =>
  import('../components/analytics/AnalyticsCharts').then((m) => ({ default: m.DevicePieChart }))
);

export const DashboardAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    document.title = 'Analytics Overview — URLRef Softics';
  }, []);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const response = await apiClient.get<string>('/api/v1/analytics/export', {
        responseType: 'text',
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'urlref_dashboard_analytics_30d.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Analytics CSV report downloaded successfully!');
    } catch {
      toast.error('Failed to export analytics report.');
    } finally {
      setIsExporting(false);
    }
  };

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Chip
            icon={<ShieldCheck size={15} color="#587529" />}
            label="30-Day Retention Active"
            variant="outlined"
            title="Raw click logs are automatically pruned after 30 days to protect visitor privacy."
            sx={{ fontWeight: 600, color: '#1C2411', borderColor: '#E4E9DC', bgcolor: '#F4F6F0' }}
          />
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
          <Button
            variant="outlined"
            color="primary"
            disableElevation
            disableRipple
            startIcon={<Download size={16} />}
            onClick={handleExportCsv}
            disabled={isExporting}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {isExporting ? 'Exporting...' : 'Export CSV (30d)'}
          </Button>
        </Box>
      </Box>

      {/* Zero Click / Empty State Guide for high retention */}
      {totalClicks === 0 && (
        <Card
          sx={{
            mb: 4,
            p: 3,
            bgcolor: '#ffffff',
            borderRadius: 1.25,
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
      <Card sx={{ mb: 4, p: 1, border: '1px solid #E4E9DC', borderRadius: 1.25, boxShadow: 'none' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1C2411' }}>
            Aggregate clicks over time (last 30 days)
          </Typography>
          <Suspense fallback={<Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress size={24} color="inherit" /></Box>}>
            <ClicksAreaChart series={overview?.clicksOverTime} emptyMessage="No clicks recorded across your links yet." height={320} />
          </Suspense>
        </CardContent>
      </Card>

      {/* Breakdown Grid */}
      <Grid container spacing={3}>
        {/* Device Breakdown */}
        <Grid item xs={12} md={6}>
          <AnalyticsCard icon={<Smartphone size={20} color="#587529" />} title="Aggregate device share">
            <Suspense fallback={<Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress size={24} color="inherit" /></Box>}>
              <DevicePieChart data={deviceData} emptyMessage="No device data recorded yet." height={260} />
            </Suspense>
          </AnalyticsCard>
        </Grid>

        {/* Top Traffic Referrers */}
        <Grid item xs={12} md={6}>
          <AnalyticsMetricsCard
            icon={<Compass size={20} color="#587529" />}
            title="Top traffic sources"
            columnHeader="Referrer domain"
            rows={overview?.trafficSources?.map((s) => ({
              key: s.referrer,
              label: s.referrer,
              clicks: s.clicks,
            }))}
            emptyMessage="No referrer data recorded yet."
          />
        </Grid>

        {/* Geographic Breakdown */}
        <Grid item xs={12}>
          <AnalyticsMetricsCard
            icon={<Globe size={20} color="#587529" />}
            title="Global visitor countries"
            columnHeader="Country code"
            rows={overview?.geographicDistribution?.map((g) => ({
              key: g.countryCode,
              label: g.countryCode,
              clicks: g.clicks,
            }))}
            emptyMessage="No geographic data recorded yet."
          />
        </Grid>
      </Grid>
    </Box>
  );
};
