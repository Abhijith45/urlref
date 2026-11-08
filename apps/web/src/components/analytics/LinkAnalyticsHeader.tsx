import React from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Tooltip,
  Button,
  Chip,
} from '@mui/material';
import { ArrowLeft, ExternalLink, Copy, Check, MousePointerClick, Download, ShieldCheck } from 'lucide-react';
import { LinkDto } from '@shortener/shared';

interface LinkAnalyticsHeaderProps {
  linkData?: LinkDto;
  totalClicks: number;
  copied: boolean;
  onCopy: () => void;
  onBack: () => void;
  onExport?: () => void;
  isExporting?: boolean;
}

export const LinkAnalyticsHeader: React.FC<LinkAnalyticsHeaderProps> = ({
  linkData,
  totalClicks,
  copied,
  onCopy,
  onBack,
  onExport,
  isExporting = false,
}) => {
  return (
    <>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink
          component="button"
          underline="hover"
          color="inherit"
          onClick={onBack}
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
            Redirecting to: <span style={{ fontWeight: 600, color: '#1C2411', wordBreak: 'break-all' }}>{linkData?.destinationUrl}</span>
            {linkData?.destinationUrl && (
              <a
                href={linkData.destinationUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open destination URL ${linkData.destinationUrl}`}
                style={{ color: '#587529', flexShrink: 0 }}
              >
                <ExternalLink size={14} />
              </a>
            )}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Chip
            icon={<ShieldCheck size={15} color="#587529" />}
            label="30-Day Retention"
            variant="outlined"
            title="Raw click logs are automatically pruned after 30 days to protect visitor privacy."
            sx={{ fontWeight: 600, color: '#1C2411', borderColor: '#E4E9DC', bgcolor: '#F4F6F0' }}
          />
          {linkData && (
            <Tooltip title={copied ? 'Copied to clipboard!' : 'Copy short link'}>
              <Button
                variant="outlined"
                size="small"
                disableElevation
                disableRipple
                startIcon={copied ? <Check size={14} color="#71951E" /> : <Copy size={14} />}
                onClick={onCopy}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {copied ? 'Copied' : 'Copy link'}
              </Button>
            </Tooltip>
          )}
          {onExport && (
            <Button
              variant="outlined"
              size="small"
              disableElevation
              disableRipple
              startIcon={<Download size={14} />}
              onClick={onExport}
              disabled={isExporting}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {isExporting ? 'Exporting...' : 'Export CSV (30d)'}
            </Button>
          )}
          <Chip
            icon={<MousePointerClick size={16} />}
            label={`${totalClicks} Total Clicks`}
            color="primary"
            sx={{ fontWeight: 700, px: 1, fontFamily: 'Geist Mono, monospace' }}
          />
        </Box>
      </Box>
    </>
  );
};
