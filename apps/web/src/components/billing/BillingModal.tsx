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

interface TierConfig {
  id: 'FREE' | 'PRO' | 'AGENCY';
  name: string;
  subtitle: string;
  monthlyPrice: string;
  annualPrice: string;
  popular?: boolean;
  features: { text: string; bold?: boolean }[];
}

const TIERS: TierConfig[] = [
  {
    id: 'FREE',
    name: 'Free Community',
    subtitle: 'For individuals and hobbyists testing links',
    monthlyPrice: '₹0',
    annualPrice: '₹0',
    features: [
      { text: '10 short links per month' },
      { text: 'Static QR code generator' },
      { text: '7 days click analytics' },
    ],
  },
  {
    id: 'PRO',
    name: 'Pro Creator',
    subtitle: 'For founders, creators, and growing SMBs',
    monthlyPrice: '₹199',
    annualPrice: '₹1,999',
    popular: true,
    features: [
      { text: '100 short links per month', bold: true },
      { text: '100 dynamic editable QRs', bold: true },
      { text: '1 custom branded domain' },
      { text: '30 days visitor analytics' },
      { text: 'Center logo on QR codes' },
    ],
  },
  {
    id: 'AGENCY',
    name: 'Growth Agency',
    subtitle: 'For digital marketing agencies and high volume brands',
    monthlyPrice: '₹499',
    annualPrice: '₹4,999',
    features: [
      { text: '1,000 short links per month', bold: true },
      { text: 'Unlimited dynamic QRs', bold: true },
      { text: 'Up to 5 custom domains' },
      { text: '365 days analytics retention' },
      { text: 'Lossless vector SVG export' },
    ],
  },
];

interface PricingTierCardProps {
  tier: TierConfig;
  interval: 'month' | 'year';
  currentTier: string;
  loadingTier: string | null;
  onUpgrade: (tier: 'PRO' | 'AGENCY') => void;
}

interface PricingCardBadgeProps {
  popular?: boolean;
  isCurrent: boolean;
}

const PricingCardBadge: React.FC<PricingCardBadgeProps> = ({ popular, isCurrent }) => {
  if (popular) {
    return (
      <Chip
        label="Most popular"
        size="small"
        sx={{
          position: 'absolute',
          top: -10,
          right: 14,
          bgcolor: '#F4BE38',
          color: '#1C2411',
          fontWeight: 800,
          fontSize: '0.68rem',
          height: 20,
        }}
      />
    );
  }
  if (isCurrent) {
    return (
      <Chip
        label="Current plan"
        size="small"
        sx={{
          position: 'absolute',
          top: -10,
          right: 14,
          bgcolor: '#587529',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '0.68rem',
          height: 20,
        }}
      />
    );
  }
  return null;
};

interface PricingCardButtonProps {
  tierId: string;
  tierName: string;
  isFree: boolean;
  isPro: boolean;
  isCurrent: boolean;
  loadingTier: string | null;
  onUpgrade: (tier: 'PRO' | 'AGENCY') => void;
}

const PricingCardButton: React.FC<PricingCardButtonProps> = ({
  tierId,
  tierName,
  isFree,
  isPro,
  isCurrent,
  loadingTier,
  onUpgrade,
}) => {
  if (isFree) {
    return (
      <Button
        variant="outlined"
        disabled
        fullWidth
        disableElevation
        disableRipple
        sx={{
          py: 0.75,
          borderRadius: 1.25,
          fontWeight: 700,
          fontSize: '0.8rem',
          textTransform: 'none',
        }}
      >
        {isCurrent ? 'Current plan' : 'Free tier'}
      </Button>
    );
  }

  const isLoading = loadingTier === tierId;
  const buttonLabel = isCurrent
    ? 'Active plan'
    : isLoading
    ? 'Connecting...'
    : `Upgrade to ${tierName.split(' ')[0]}`;

  return (
    <Button
      variant={isPro ? 'contained' : 'outlined'}
      fullWidth
      disableElevation
      disableRipple
      disabled={loadingTier !== null || isCurrent}
      onClick={() => onUpgrade(tierId as 'PRO' | 'AGENCY')}
      startIcon={
        isLoading ? (
          <CircularProgress size={14} color="inherit" />
        ) : isPro ? (
          <Zap size={14} />
        ) : null
      }
      sx={{
        py: 0.75,
        borderRadius: 1.25,
        fontWeight: 700,
        fontSize: '0.825rem',
        textTransform: 'none',
        ...(isPro
          ? {
              bgcolor: isCurrent ? '#587529' : '#1C2411',
              color: '#ffffff',
              '&:hover': { bgcolor: '#000000' },
            }
          : {
              borderColor: '#1C2411',
              color: '#1C2411',
              '&:hover': { bgcolor: '#F4F7EE' },
            }),
      }}
    >
      {buttonLabel}
    </Button>
  );
};

const PricingTierCard: React.FC<PricingTierCardProps> = ({
  tier,
  interval,
  currentTier,
  loadingTier,
  onUpgrade,
}) => {
  const isCurrent = currentTier === tier.id;
  const isPro = tier.id === 'PRO';
  const isFree = tier.id === 'FREE';
  const price = interval === 'month' ? tier.monthlyPrice : tier.annualPrice;
  const period = interval === 'month' ? '/ month' : '/ year';
  const cardBorder = isPro
    ? '2px solid #F4BE38'
    : isCurrent
    ? '2px solid #587529'
    : '1px solid #E4E9DC';

  return (
    <Box
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        bgcolor: isPro ? '#ffffff' : '#FBFBFA',
        borderRadius: 2.25,
        border: cardBorder,
        boxShadow: isPro ? '0 6px 20px rgba(244, 190, 56, 0.12)' : 'none',
        position: 'relative',
      }}
    >
      <PricingCardBadge popular={tier.popular} isCurrent={isCurrent} />

      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1C2411', fontSize: '0.95rem', mb: 0.25 }}>
        {tier.name}
      </Typography>
      <Typography variant="caption" sx={{ color: '#556345', mb: 1.25, fontSize: '0.72rem', lineHeight: 1.3 }}>
        {tier.subtitle}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1C2411', fontSize: '1.65rem' }}>
          {price}
        </Typography>
        <Typography variant="caption" sx={{ color: '#556345', fontSize: '0.75rem' }}>
          {period}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, mb: 1.75, display: 'flex', flexDirection: 'column', gap: 0.85 }}>
        {tier.features.map((f) => (
          <Box key={f.text} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Check size={14} color="#71951E" />
            <Typography
              variant="body2"
              sx={{
                fontWeight: f.bold ? 600 : 400,
                color: '#1C2411',
                fontSize: '0.78rem',
              }}
            >
              {f.text}
            </Typography>
          </Box>
        ))}
      </Box>

      <PricingCardButton
        tierId={tier.id}
        tierName={tier.name}
        isFree={isFree}
        isPro={isPro}
        isCurrent={isCurrent}
        loadingTier={loadingTier}
        onUpgrade={onUpgrade}
      />
    </Box>
  );
};

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
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : err instanceof Error
          ? err.message
          : 'Failed to start Stripe checkout session.';
      setError(message || 'Failed to start Stripe checkout session.');
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
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : err instanceof Error
          ? err.message
          : 'Failed to open Stripe billing portal.';
      setError(message || 'Failed to open Stripe billing portal.');
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
            borderRadius: 2.75,
            p: { xs: 2, sm: 2.5 },
            bgcolor: '#ffffff',
            border: '1px solid #E4E9DC',
            boxShadow: '0 24px 48px -12px rgba(88, 117, 41, 0.2)',
            maxWidth: 880,
            maxHeight: { xs: '90vh', md: '92vh' },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        },
      }}
    >
      <IconButton
        onClick={onClose}
        size="small"
        aria-label="Close dialog"
        disableRipple
        sx={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 10,
          color: '#556345',
          bgcolor: '#FBFBFA',
          border: '1px solid #E4E9DC',
          minWidth: 36,
          minHeight: 36,
          '&:hover': { bgcolor: '#F4F7EE' },
        }}
      >
        <X size={16} />
      </IconButton>

      <DialogContent sx={{ p: 0, pt: 0.5, textAlign: 'center', overflowY: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 1.5 }}>
          <Chip
            icon={<Sparkles size={13} color="#587529" />}
            label="Transparent pricing with zero hidden fees"
            size="small"
            sx={{
              bgcolor: 'rgba(237, 218, 94, 0.3)',
              color: '#587529',
              fontWeight: 700,
              fontSize: '0.72rem',
              height: 22,
              mb: 1,
              border: '1px solid #EDDA5E',
            }}
          />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#1C2411',
              fontSize: { xs: '1.35rem', sm: '1.55rem' },
              lineHeight: 1.25,
              mb: 0.5,
              letterSpacing: '-0.02em',
              textWrap: 'balance',
            }}
          >
            Upgrade your link and QR capabilities
          </Typography>
          <Typography variant="body2" sx={{ color: '#556345', maxWidth: 520, mx: 'auto', fontSize: '0.825rem', lineHeight: 1.35, textWrap: 'pretty' }}>
            Scale with custom branded domains, dynamic editable QR codes, and real time click analytics.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 1.5, py: 0.5, textAlign: 'left', borderRadius: 1.5, fontSize: '0.8rem' }}>
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
            borderRadius: 2,
            border: '1px solid #E4E9DC',
            mb: 2,
          }}
        >
          <Button
            size="small"
            disableElevation
            disableRipple
            onClick={() => setInterval('month')}
            sx={{
              px: 2,
              py: 0.5,
              borderRadius: 1.5,
              fontWeight: 700,
              fontSize: '0.8rem',
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
              px: 2,
              py: 0.5,
              borderRadius: 1.5,
              fontWeight: 700,
              fontSize: '0.8rem',
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
                ml: 0.75,
                bgcolor: '#EDDA5E',
                color: '#587529',
                fontWeight: 800,
                fontSize: '0.68rem',
                height: 18,
              }}
            />
          </Button>
        </Box>

        {/* Active Subscriber Manage Link */}
        {isActiveSubscriber && (
          <Box sx={{ mb: 2, p: 1.25, bgcolor: '#FBFBFA', borderRadius: 2, border: '1px solid #E4E9DC' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1C2411', fontSize: '0.825rem' }}>
                  You are currently subscribed to the {currentTier} plan
                </Typography>
                <Typography variant="caption" sx={{ color: '#556345', fontSize: '0.72rem' }}>
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
                startIcon={portalLoading ? <CircularProgress size={12} color="inherit" /> : <ExternalLink size={12} />}
                sx={{
                  borderColor: '#587529',
                  color: '#587529',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  py: 0.5,
                  textTransform: 'none',
                }}
              >
                Manage subscription in Stripe
              </Button>
            </Box>
          </Box>
        )}

        {/* Pricing Cards Grid */}
        <Grid container spacing={2} alignItems="stretch">
          {TIERS.map((tier) => (
            <Grid item xs={12} md={4} key={tier.id}>
              <PricingTierCard
                tier={tier}
                interval={interval}
                currentTier={currentTier}
                loadingTier={loadingTier}
                onUpgrade={handleUpgrade}
              />
            </Grid>
          ))}
        </Grid>

        {/* Security badge */}
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, color: '#556345', fontSize: '0.78rem' }}>
          <ShieldCheck size={14} color="#71951E" />
          <span>Secured with 256 bit SSL encryption via Stripe</span>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
