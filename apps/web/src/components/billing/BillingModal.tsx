import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Button,
  Box,
  IconButton,
  Grid,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { X, Check, Sparkles, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { apiClient } from '../../services/api-client';
import { SubscriptionStatusDto } from '@shortener/shared';

interface BillingModalProps {
  open: boolean;
  onClose: () => void;
  subscription?: SubscriptionStatusDto | null;
  onRefresh?: () => void;
}

export const BillingModal: React.FC<BillingModalProps> = ({
  open,
  onClose,
  subscription,
}) => {
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTier = subscription?.tier || 'FREE';
  const isActiveSubscriber = subscription?.status === 'active' && currentTier !== 'FREE';

  const handleUpgrade = async (tier: 'PRO' | 'AGENCY') => {
    setLoadingTier(tier);
    setError(null);
    try {
      const res = await apiClient.post<{ data: { url: string } }>('/api/v1/billing/checkout', {
        tier,
        interval,
        successUrl: `${window.location.origin}/dashboard?billing=success`,
        cancelUrl: `${window.location.origin}/dashboard?billing=cancel`,
      });

      if (res.data.data.url) {
        window.location.href = res.data.data.url;
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to start Stripe checkout session. Please ensure server Stripe keys are configured.',
      );
    } finally {
      setLoadingTier(null);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<{ data: { url: string } }>('/api/v1/billing/portal');
      if (res.data.data.url) {
        window.location.href = res.data.data.url;
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to open Stripe billing portal.',
      );
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3.5,
            p: { xs: 2.5, sm: 3.5 },
            bgcolor: '#ffffff',
            border: '1px solid #E4E9DC',
            boxShadow: '0 24px 48px -12px rgba(88, 117, 41, 0.2)',
          },
        },
      }}
    >
      <IconButton
        onClick={onClose}
        size="small"
        disableRipple
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: '#556345',
          bgcolor: '#FBFBFA',
          border: '1px solid #E4E9DC',
          '&:hover': { bgcolor: '#F4F7EE' },
        }}
      >
        <X size={18} />
      </IconButton>

      <DialogContent sx={{ p: 0, pt: 1, textAlign: 'center' }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Chip
            icon={<Sparkles size={14} color="#587529" />}
            label="Transparent pricing with zero hidden fees"
            size="small"
            sx={{
              bgcolor: 'rgba(237, 218, 94, 0.3)',
              color: '#587529',
              fontWeight: 700,
              fontSize: '0.75rem',
              mb: 1.5,
              border: '1px solid #EDDA5E',
            }}
          />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: '#1C2411',
              mb: 1,
              letterSpacing: '-0.02em',
              textWrap: 'balance',
            }}
          >
            Upgrade your link and QR capabilities
          </Typography>
          <Typography variant="body2" sx={{ color: '#556345', maxWidth: 540, mx: 'auto', textWrap: 'pretty' }}>
            Scale with custom branded domains, dynamic editable QR codes, and real time click analytics.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, textAlign: 'left', borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Billing Interval Toggle */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            p: 0.5,
            bgcolor: '#FBFBFA',
            borderRadius: 3,
            border: '1px solid #E4E9DC',
            mb: 4,
          }}
        >
          <Button
            size="small"
            disableElevation
            disableRipple
            onClick={() => setInterval('month')}
            sx={{
              px: 2.5,
              py: 0.75,
              borderRadius: 2.5,
              fontWeight: 700,
              fontSize: '0.85rem',
              textTransform: 'none',
              bgcolor: interval === 'month' ? '#ffffff' : 'transparent',
              color: interval === 'month' ? '#1C2411' : '#556345',
              boxShadow: interval === 'month' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Monthly billing
          </Button>
          <Button
            size="small"
            disableElevation
            disableRipple
            onClick={() => setInterval('year')}
            sx={{
              px: 2.5,
              py: 0.75,
              borderRadius: 2.5,
              fontWeight: 700,
              fontSize: '0.85rem',
              textTransform: 'none',
              bgcolor: interval === 'year' ? '#ffffff' : 'transparent',
              color: interval === 'year' ? '#1C2411' : '#556345',
              boxShadow: interval === 'year' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Annual billing
            <Chip
              label="Save 17%"
              size="small"
              sx={{
                ml: 1,
                bgcolor: '#EDDA5E',
                color: '#587529',
                fontWeight: 800,
                fontSize: '0.7rem',
                height: 20,
              }}
            />
          </Button>
        </Box>

        {/* Active Subscriber Manage Link */}
        {isActiveSubscriber && (
          <Box sx={{ mb: 3, p: 2, bgcolor: '#FBFBFA', borderRadius: 2.5, border: '1px solid #E4E9DC' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1C2411' }}>
                  You are currently subscribed to the {currentTier} plan
                </Typography>
                <Typography variant="caption" sx={{ color: '#556345' }}>
                  Renews: {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'Active'}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                disableElevation
                disableRipple
                onClick={handleManageBilling}
                disabled={portalLoading}
                startIcon={portalLoading ? <CircularProgress size={14} color="inherit" /> : <ExternalLink size={14} />}
                sx={{
                  borderColor: '#587529',
                  color: '#587529',
                  fontWeight: 700,
                  textTransform: 'none',
                }}
              >
                Manage subscription in Stripe
              </Button>
            </Box>
          </Box>
        )}

        {/* Pricing Cards Grid */}
        <Grid container spacing={2.5} alignItems="stretch">
          {/* Free Tier */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'left',
                bgcolor: '#FBFBFA',
                borderRadius: 3,
                border: currentTier === 'FREE' ? '2px solid #587529' : '1px solid #E4E9DC',
                position: 'relative',
              }}
            >
              {currentTier === 'FREE' && (
                <Chip
                  label="Current plan"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -12,
                    right: 16,
                    bgcolor: '#587529',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
              )}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1C2411' }}>
                Free Community
              </Typography>
              <Typography variant="caption" sx={{ color: '#556345', mb: 2 }}>
                For individuals and hobbyists testing links
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1C2411' }}>
                  ₹0
                </Typography>
                <Typography variant="caption" sx={{ color: '#556345' }}>
                  / month
                </Typography>
              </Box>

              <Box sx={{ flex: 1, mb: 3, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2" sx={{ color: '#1C2411' }}>
                    10 short links per month
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2" sx={{ color: '#1C2411' }}>
                    Static QR code generator
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2" sx={{ color: '#1C2411' }}>
                    7 days click analytics
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="outlined"
                disabled
                fullWidth
                disableElevation
                disableRipple
                sx={{
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: 'none',
                }}
              >
                {currentTier === 'FREE' ? 'Current plan' : 'Free tier'}
              </Button>
            </Box>
          </Grid>

          {/* Pro Tier (Featured) */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'left',
                bgcolor: '#ffffff',
                borderRadius: 3,
                border: '2px solid #F4BE38',
                boxShadow: '0 8px 24px rgba(244, 190, 56, 0.15)',
                position: 'relative',
              }}
            >
              <Chip
                label="Most popular"
                size="small"
                sx={{
                  position: 'absolute',
                  top: -12,
                  right: 16,
                  bgcolor: '#F4BE38',
                  color: '#1C2411',
                  fontWeight: 800,
                  fontSize: '0.7rem',
                }}
              />

              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1C2411' }}>
                Pro Creator
              </Typography>
              <Typography variant="caption" sx={{ color: '#556345', mb: 2 }}>
                For founders, creators, and growing SMBs
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1C2411' }}>
                  {interval === 'month' ? '₹199' : '₹1,999'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#556345' }}>
                  {interval === 'month' ? '/ month' : '/ year'}
                </Typography>
              </Box>

              <Box sx={{ flex: 1, mb: 3, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1C2411' }}>
                    100 short links per month
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1C2411' }}>
                    100 dynamic editable QRs
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2" sx={{ color: '#1C2411' }}>
                    1 custom branded domain
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2" sx={{ color: '#1C2411' }}>
                    30 days visitor analytics
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2" sx={{ color: '#1C2411' }}>
                    Center logo on QR codes
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                fullWidth
                disableElevation
                disableRipple
                disabled={loadingTier !== null || currentTier === 'PRO'}
                onClick={() => handleUpgrade('PRO')}
                startIcon={loadingTier === 'PRO' ? <CircularProgress size={16} color="inherit" /> : <Zap size={16} />}
                sx={{
                  py: 1.1,
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: 'none',
                  bgcolor: currentTier === 'PRO' ? '#587529' : '#1C2411',
                  color: '#ffffff',
                  '&:hover': { bgcolor: '#000000' },
                }}
              >
                {currentTier === 'PRO' ? 'Active plan' : loadingTier === 'PRO' ? 'Connecting...' : 'Upgrade to Pro'}
              </Button>
            </Box>
          </Grid>

          {/* Agency Tier */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'left',
                bgcolor: '#FBFBFA',
                borderRadius: 3,
                border: currentTier === 'AGENCY' ? '2px solid #587529' : '1px solid #E4E9DC',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1C2411' }}>
                Growth Agency
              </Typography>
              <Typography variant="caption" sx={{ color: '#556345', mb: 2 }}>
                For digital marketing agencies and high volume brands
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1C2411' }}>
                  {interval === 'month' ? '₹499' : '₹4,999'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#556345' }}>
                  {interval === 'month' ? '/ month' : '/ year'}
                </Typography>
              </Box>

              <Box sx={{ flex: 1, mb: 3, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1C2411' }}>
                    1,000 short links per month
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1C2411' }}>
                    Unlimited dynamic QRs
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2" sx={{ color: '#1C2411' }}>
                    Up to 5 custom domains
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2" sx={{ color: '#1C2411' }}>
                    365 days analytics retention
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2" sx={{ color: '#1C2411' }}>
                    Lossless vector SVG export
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="outlined"
                fullWidth
                disableElevation
                disableRipple
                disabled={loadingTier !== null || currentTier === 'AGENCY'}
                onClick={() => handleUpgrade('AGENCY')}
                startIcon={loadingTier === 'AGENCY' ? <CircularProgress size={16} color="inherit" /> : null}
                sx={{
                  py: 1.1,
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: 'none',
                  borderColor: '#1C2411',
                  color: '#1C2411',
                  '&:hover': { bgcolor: '#F4F7EE' },
                }}
              >
                {currentTier === 'AGENCY' ? 'Active plan' : loadingTier === 'AGENCY' ? 'Connecting...' : 'Upgrade to Agency'}
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Security badge */}
        <Box sx={{ mt: 3.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: '#556345', fontSize: '0.85rem' }}>
          <ShieldCheck size={16} color="#71951E" />
          <span>Secured with 256 bit SSL encryption via Stripe</span>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
