import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Button,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import { queryKeys } from '../services/query-keys';
import { LinkAnalyticsDto, LinkDto } from '@shortener/shared';
import { ExternalLink, MousePointerClick, Smartphone, Globe, Compass, Copy, QrCode } from 'lucide-react';
import { toast } from 'react-toastify';
import { AnalyticsCard, AnalyticsMetricsCard } from '../components/analytics/AnalyticsShared';
import { LinkAnalyticsHeader } from '../components/analytics/LinkAnalyticsHeader';

const ClicksAreaChart = lazy(() =>
  import('../components/analytics/AnalyticsCharts').then((m) => ({ default: m.ClicksAreaChart }))
);
const DevicePieChart = lazy(() =>
  import('../components/analytics/AnalyticsCharts').then((m) => ({ default: m.DevicePieChart }))
);

const ZeroClicksCard: React.FC<{
  linkData: LinkDto | undefined;
  onCopy: () => void;
  onDesignQr: () => void;
}> = ({ linkData, onCopy, onDesignQr }) => (
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
        onClick={onCopy}
        sx={{ textTransform: 'none', fontWeight: 700 }}
      >
        Copy short link
      </Button>
      <Button
        variant="outlined"
        disableElevation
        disableRipple
        startIcon={<QrCode size={16} />}
        onClick={onDesignQr}
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
);

export const LinkAnalyticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = async () => {
    if (!id) return;
    setIsExporting(true);
    try {
      const response = await apiClient.get<string>(`/api/v1/analytics/${id}/export`, {
        responseType: 'text',
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `urlref_${linkData?.code || 'link'}_analytics_30d.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Link analytics CSV report downloaded successfully!');
    } catch {
      toast.error('Failed to export link analytics report.');
    } finally {
      setIsExporting(false);
    }
  };

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
      <LinkAnalyticsHeader
        linkData={linkData}
        totalClicks={totalClicks}
        copied={copied}
        onCopy={handleCopy}
        onBack={() => navigate('/dashboard/links')}
        onExport={handleExportCsv}
        isExporting={isExporting}
      />

      {/* Zero Clicks Retention Card */}
      {totalClicks === 0 && (
        <ZeroClicksCard
          linkData={linkData}
          onCopy={handleCopy}
          onDesignQr={() => navigate('/dashboard/qr')}
        />
      )}

      {/* Clicks Over Time Area Chart */}
      <Card sx={{ mb: 4, p: 1, border: '1px solid #E4E9DC', borderRadius: 1.25, boxShadow: 'none' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1C2411' }}>
            Clicks over time (last 30 days)
          </Typography>
          <Suspense fallback={<Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress size={24} color="inherit" /></Box>}>
            <ClicksAreaChart series={analytics?.series} emptyMessage="No clicks recorded for this link yet." height={300} />
          </Suspense>
        </CardContent>
      </Card>

      {/* Breakdown Grid */}
      <Grid container spacing={3}>
        {/* Device Breakdown */}
        <Grid item xs={12} md={6}>
          <AnalyticsCard icon={<Smartphone size={20} color="#587529" />} title="Device breakdown">
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
            rows={analytics?.trafficSources?.map((source) => ({
              key: source.referrer,
              label: source.referrer,
              clicks: source.clicks,
            }))}
            emptyMessage="No referrer data recorded yet (e.g. direct traffic)."
          />
        </Grid>

        {/* Geographic Breakdown */}
        <Grid item xs={12}>
          <AnalyticsMetricsCard
            icon={<Globe size={20} color="#587529" />}
            title="Geographic distribution (ISO country code)"
            columnHeader="Country code"
            rows={analytics?.geographicDistribution?.map((geo) => ({
              key: geo.countryCode,
              label: geo.countryCode,
              clicks: geo.clicks,
            }))}
            emptyMessage="No geographic data available for this link."
          />
        </Grid>
      </Grid>
    </Box>
  );
};
