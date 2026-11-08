import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Tooltip,
  Collapse,
  Chip,
} from '@mui/material';
import { Copy, Check, Sparkles, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api-client';
import { LinkDto } from '@shortener/shared';
import { BillingModal } from '../billing/BillingModal';

interface QuickShortenWidgetProps {
  onLinkCreated?: (link: LinkDto) => void;
  onUpgradeClick?: () => void;
}

interface QuotaResponse {
  used: number;
  total: number;
  remaining: number;
  resetAt: string;
}

export const QuickShortenWidget: React.FC<QuickShortenWidgetProps> = ({ onLinkCreated, onUpgradeClick }) => {
  const queryClient = useQueryClient();
  const [destinationUrl, setDestinationUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<LinkDto | null>(null);
  const [copied, setCopied] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);

  // Fetch monthly quota
  const { data: quota } = useQuery<QuotaResponse>({
    queryKey: ['links', 'quota'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: QuotaResponse }>('/api/v1/links/quota');
      return res.data.data;
    },
  });

  const isQuotaExceeded = quota ? quota.used >= quota.total : false;

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationUrl || isQuotaExceeded) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ data: LinkDto }>('/api/v1/links', {
        destinationUrl,
        customAlias: customAlias.trim() ? customAlias.trim() : undefined,
      });

      const newLink = response.data.data;
      setCreatedLink(newLink);
      setDestinationUrl('');
      setCustomAlias('');

      // Refresh quota and links list
      queryClient.invalidateQueries({ queryKey: ['links'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      if (onLinkCreated) {
        onLinkCreated(newLink);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create short link. Please verify the URL.');
      }
    } finally {
      setLoading(false);
    }
  };

  const shortLinkUrl = createdLink ? createdLink.shortUrl : '';

  const handleCopy = () => {
    if (!shortLinkUrl) return;
    navigator.clipboard.writeText(shortLinkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card sx={{ mb: 4, background: '#ffffff', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Sparkles size={20} color="#587529" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Quick Shorten URL
            </Typography>
          </Box>

          {quota && (
            <Tooltip title={`Monthly limit: ${quota.total} links per calendar month. Resets on ${new Date(quota.resetAt).toLocaleDateString()}.`}>
              <Chip
                label={`Monthly Quota: ${quota.used}/${quota.total} links used`}
                color={isQuotaExceeded ? 'error' : quota.used >= quota.total * 0.8 ? 'warning' : 'primary'}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: '0.78rem' }}
              />
            </Tooltip>
          )}
        </Box>

        {isQuotaExceeded && (
          <Alert
            severity="warning"
            icon={<AlertCircle size={18} />}
            sx={{ mb: 2.5, borderRadius: 2 }}
            action={
              <Button
                variant="contained"
                size="small"
                disableElevation
                disableRipple
                onClick={() => (onUpgradeClick ? onUpgradeClick() : setBillingOpen(true))}
                sx={{
                  bgcolor: '#1C2411',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: '#000000' },
                }}
              >
                Upgrade plan
              </Button>
            }
          >
            You have reached your monthly limit of <strong>{quota?.total} links</strong>. Upgrade to Pro (100 links/mo) or Agency (1,000 links/mo) to unlock immediate capacity, dynamic QRs, and custom domains.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleShorten}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
            <TextField
              placeholder="Paste long destination URL (e.g. https://example.com/very/long/path)"
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              fullWidth
              required
              disabled={loading || isQuotaExceeded}
              sx={{ flexGrow: 1 }}
            />
            <Button
              type="submit"
              variant="contained"
              disableElevation
              disableRipple
              disabled={loading || !destinationUrl || isQuotaExceeded}
              sx={{ px: 4, py: { xs: 1.2, sm: 'auto' }, whiteSpace: 'nowrap', fontWeight: 700 }}
            >
              {loading ? 'Shortening...' : 'Shorten'}
            </Button>
          </Box>

          <Box sx={{ mt: 1.5 }}>
            <Button
              size="small"
              disableElevation
              disableRipple
              onClick={() => setShowAdvanced(!showAdvanced)}
              endIcon={showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 500 }}
              disabled={isQuotaExceeded}
            >
              Advanced options (Custom Alias)
            </Button>

            <Collapse in={showAdvanced}>
              <Box sx={{ mt: 2, p: 2, bgcolor: '#FBFBFA', borderRadius: 2, border: '1px solid #E4E9DC' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Custom Alias (Optional)
                </Typography>
                <TextField
                  placeholder="e.g. spring-sale-2026 (alphanumeric, 3-30 chars)"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  fullWidth
                  size="small"
                  disabled={loading || isQuotaExceeded}
                  helperText="Leave empty to automatically generate a cryptographic 7-character Base62 code."
                />
              </Box>
            </Collapse>
          </Box>
        </Box>

        {createdLink && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(88, 117, 41, 0.08)',
              border: '1px solid rgba(88, 117, 41, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                Newly Shortened URL:
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {createdLink.shortUrl}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                <Button
                  variant="outlined"
                  size="small"
                  disableElevation
                  disableRipple
                  onClick={handleCopy}
                  startIcon={copied ? <Check size={16} color="#71951E" /> : <Copy size={16} />}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </Tooltip>
            </Box>
          </Box>
        )}
      </CardContent>

      <BillingModal open={billingOpen} onClose={() => setBillingOpen(false)} />
    </Card>
  );
};
