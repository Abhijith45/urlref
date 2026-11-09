import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  LinearProgress,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import {
  CreditCard,
  Download,
  ExternalLink,
  Receipt,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import { SubscriptionStatusDto, InvoiceDto } from '@shortener/shared';
import { BillingModal } from '../components/billing/BillingModal';
import { toast } from 'react-toastify';

export const DashboardSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // 1. Fetch Subscription status
  const {
    data: subscription,
    refetch: refetchSub,
  } = useQuery<SubscriptionStatusDto>({
    queryKey: ['billing', 'subscription'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: SubscriptionStatusDto }>('/api/v1/billing/subscription');
      return res.data.data;
    },
  });

  // 2. Fetch Invoices list
  const {
    data: invoices,
    isLoading: isInvoicesLoading,
  } = useQuery<InvoiceDto[]>({
    queryKey: ['billing', 'invoices'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: InvoiceDto[] }>('/api/v1/billing/invoices');
      return res.data.data;
    },
  });

  // 3. Launch Stripe Customer Portal
  const handleLaunchPortal = async () => {
    try {
      setPortalLoading(true);
      const res = await apiClient.post<{ data: { url: string } }>('/api/v1/billing/portal');
      if (res.data?.data?.url) {
        window.location.href = res.data.data.url;
      } else {
        toast.error('Unable to open billing portal');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to launch billing portal';
      toast.info(msg);
    } finally {
      setPortalLoading(false);
    }
  };

  const currentTier = subscription?.tier || 'FREE';
  const isPaidTier = currentTier === 'PRO' || currentTier === 'AGENCY';
  const linksUsed = subscription?.usage?.linksCreatedThisMonth ?? 0;
  const maxLinks = subscription?.limits?.maxLinksPerMonth ?? 10;
  const linksPercent = Math.min(100, Math.round((linksUsed / maxLinks) * 100));

  const domainsUsed = subscription?.usage?.customDomainsCount ?? 0;
  const maxDomains = subscription?.limits?.maxCustomDomains ?? 0;
  const domainsPercent = maxDomains > 0 ? Math.min(100, Math.round((domainsUsed / maxDomains) * 100)) : 0;

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1C2411', mb: 0.5 }}>
          Account Settings
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Manage your subscription plan, billing details, and download past invoices.
        </Typography>
      </Box>

      {/* Settings Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: '#E4E9DC', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: 'text.secondary',
              '&.Mui-selected': {
                color: '#587529',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#587529',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab icon={<CreditCard size={18} />} iconPosition="start" label="Billing & Invoices" />
          <Tab label="Profile & Security" disabled />
        </Tabs>
      </Box>

      {/* Tab 0: Billing & Invoices */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Subscription Overview Card */}
          <Card
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              border: '1px solid #E4E9DC',
              borderRadius: 2,
              boxShadow: 'none',
              bgcolor: '#ffffff',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2,
                mb: 3,
                pb: 2.5,
                borderBottom: '1px solid #E4E9DC',
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#1C2411' }}>
                    {currentTier === 'FREE' ? 'Free Community Plan' : currentTier === 'PRO' ? 'Pro Creator Plan' : 'Growth Agency Plan'}
                  </Typography>
                  <Chip
                    label={isPaidTier ? (subscription?.status === 'active' ? 'Active' : subscription?.status || 'Active') : 'Free Tier'}
                    color={isPaidTier ? 'success' : 'default'}
                    size="small"
                    sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {subscription?.currentPeriodEnd
                    ? `Next billing cycle renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : 'Upgrade anytime to connect custom domains and increase link limits.'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {isPaidTier && (
                  <Button
                    variant="outlined"
                    startIcon={portalLoading ? <CircularProgress size={16} /> : <ExternalLink size={16} />}
                    onClick={handleLaunchPortal}
                    disabled={portalLoading}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      borderColor: '#E4E9DC',
                      color: '#1C2411',
                      '&:hover': { borderColor: '#587529', bgcolor: '#FBFBFA' },
                    }}
                  >
                    Stripe Customer Portal
                  </Button>
                )}

                <Button
                  variant="contained"
                  startIcon={<Sparkles size={16} />}
                  onClick={() => setBillingModalOpen(true)}
                  sx={{
                    bgcolor: '#587529',
                    color: '#ffffff',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#465e20' },
                  }}
                >
                  {isPaidTier ? 'Change Plan' : 'Upgrade Plan'}
                </Button>
              </Box>
            </Box>

            {/* Quota Progress Overview */}
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: '#FBFBFA', borderRadius: 1.5, border: '1px solid #E4E9DC' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      MONTHLY LINKS QUOTA
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#1C2411' }}>
                      {linksUsed} / {maxLinks} ({linksPercent}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={linksPercent}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: '#E4E9DC',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: linksPercent > 90 ? '#D9483B' : '#587529',
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: '#FBFBFA', borderRadius: 1.5, border: '1px solid #E4E9DC' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      CUSTOM BRANDED DOMAINS
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#1C2411' }}>
                      {domainsUsed} / {maxDomains} allowed
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={domainsPercent}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: '#E4E9DC',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#587529',
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Card>

          {/* Past Invoices Table Card */}
          <Card
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              border: '1px solid #E4E9DC',
              borderRadius: 2,
              boxShadow: 'none',
              bgcolor: '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Receipt size={22} color="#587529" />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1C2411' }}>
                  Billing Invoices & Receipts
                </Typography>
              </Box>
              {isPaidTier && (
                <Button
                  size="small"
                  onClick={handleLaunchPortal}
                  endIcon={<ArrowUpRight size={14} />}
                  sx={{ textTransform: 'none', fontWeight: 600, color: '#587529' }}
                >
                  Manage in Stripe
                </Button>
              )}
            </Box>

            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
              Download past invoices for business tax compliance and view paid transaction records.
            </Typography>

            {isInvoicesLoading ? (
              <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={30} sx={{ color: '#587529' }} />
              </Box>
            ) : !invoices || invoices.length === 0 ? (
              <Box
                sx={{
                  py: 6,
                  px: 2,
                  textAlign: 'center',
                  bgcolor: '#FBFBFA',
                  borderRadius: 2,
                  border: '1px dashed #E4E9DC',
                }}
              >
                <Receipt size={36} color="#8A9A78" style={{ marginBottom: 12 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1C2411', mb: 0.5 }}>
                  No Invoices Found
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 420, mx: 'auto', mb: 2 }}>
                  {isPaidTier
                    ? 'Your upcoming subscription invoice will appear here once generated by Stripe.'
                    : 'You are currently on the Free plan. Upgrade to Pro or Agency to connect custom domains and generate official invoices.'}
                </Typography>
                {!isPaidTier && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Sparkles size={14} />}
                    onClick={() => setBillingModalOpen(true)}
                    sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#587529', color: '#587529' }}
                  >
                    View Plans
                  </Button>
                )}
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E4E9DC', borderRadius: 1.5 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#FBFBFA' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Invoice ID</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>Receipt / PDF</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {new Date(inv.created).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' }}>
                          {inv.id}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {inv.currency.toUpperCase() === 'INR' ? '₹' : '$'}
                          {(inv.amountPaid / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={inv.status.toUpperCase()}
                            color={inv.status === 'paid' ? 'success' : 'default'}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            {inv.pdfUrl ? (
                              <Tooltip title="Download PDF Invoice">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<Download size={13} />}
                                  href={inv.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{
                                    textTransform: 'none',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    borderColor: '#E4E9DC',
                                    color: '#587529',
                                    '&:hover': { borderColor: '#587529', bgcolor: '#FBFBFA' },
                                  }}
                                >
                                  PDF
                                </Button>
                              </Tooltip>
                            ) : null}

                            {inv.hostedInvoiceUrl ? (
                              <Tooltip title="View Stripe Receipt Online">
                                <Button
                                  variant="text"
                                  size="small"
                                  startIcon={<ExternalLink size={13} />}
                                  href={inv.hostedInvoiceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}
                                >
                                  Receipt
                                </Button>
                              </Tooltip>
                            ) : null}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Box>
      )}

      {/* Upgrade Modal */}
      <BillingModal
        open={billingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        subscription={subscription}
        onRefresh={() => refetchSub()}
      />
    </Box>
  );
};
