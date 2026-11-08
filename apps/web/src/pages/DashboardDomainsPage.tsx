import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Globe,
  Plus,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import { CustomDomainDto, SubscriptionStatusDto } from '@shortener/shared';
import { BillingModal } from '../components/billing/BillingModal';

export const DashboardDomainsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [connectOpen, setConnectOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomDomainDto | null>(null);
  const [billingOpen, setBillingOpen] = useState(false);

  // Form states
  const [hostname, setHostname] = useState('');
  const [custom404Url, setCustom404Url] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Branded Domains — URLRef Softics';
  }, []);

  // Fetch subscription tier
  const { data: subscription } = useQuery<SubscriptionStatusDto>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: SubscriptionStatusDto }>('/api/v1/billing/subscription');
      return res.data.data;
    },
  });

  // Fetch custom domains
  const { data: domains, isLoading } = useQuery<CustomDomainDto[]>({
    queryKey: ['domains'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: CustomDomainDto[] }>('/api/v1/domains');
      return res.data.data;
    },
  });

  // Create domain mutation
  const createMutation = useMutation({
    mutationFn: async (payload: { hostname: string; custom404Url?: string }) => {
      const res = await apiClient.post<{ data: CustomDomainDto }>('/api/v1/domains', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      setConnectOpen(false);
      setHostname('');
      setCustom404Url('');
      setFormError(null);
    },
    onError: (err: unknown) => {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Failed to register domain');
      }
    },
  });

  // Verify domain mutation
  const verifyMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const res = await apiClient.post<{
        data: CustomDomainDto;
        meta?: { verification?: { verified: boolean; message: string } };
      }>(`/api/v1/domains/${domainId}/verify`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      if (data.meta?.verification?.verified) {
        alert('Domain verified successfully! It is now active for short links.');
      } else {
        alert(data.meta?.verification?.message || 'DNS verification still pending. Please allow time for DNS propagation.');
      }
    },
    onError: (err: unknown) => {
      alert(err instanceof Error ? err.message : 'Verification failed');
    },
  });

  // Delete domain mutation
  const deleteMutation = useMutation({
    mutationFn: async (domainId: string) => {
      await apiClient.delete(`/api/v1/domains/${domainId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      setDeleteTarget(null);
    },
  });

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostname.trim()) return;
    createMutation.mutate({
      hostname: hostname.trim(),
      custom404Url: custom404Url.trim() || undefined,
    });
  };

  const isFreePlan = !subscription || subscription.tier === 'FREE';
  const maxAllowed = subscription?.limits?.maxCustomDomains ?? 0;
  const currentCount = domains?.length ?? 0;
  const isAtLimit = currentCount >= maxAllowed;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: '#1C2411' }}>
            Branded Domains
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Connect custom subdomains (e.g. go.yourcompany.com) to publish short links under your own brand.
          </Typography>
        </Box>

        <Button
          variant="contained"
          disableElevation
          disableRipple
          startIcon={<Plus size={18} />}
          onClick={() => {
            if (isFreePlan || isAtLimit) {
              setBillingOpen(true);
            } else {
              setConnectOpen(true);
            }
          }}
          sx={{ px: 3, py: 1, textTransform: 'none', fontWeight: 700 }}
        >
          Connect domain
        </Button>
      </Box>

      {/* Free Plan / Quota Upgrade Teaser */}
      {isFreePlan && (
        <Card
          sx={{
            mb: 4,
            p: 3,
            bgcolor: 'rgba(237, 218, 94, 0.25)',
            border: '1px solid #EDDA5E',
            borderRadius: 3,
            boxShadow: 'none',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ maxWidth: 650 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Sparkles size={18} color="#71951E" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#587529' }}>
                  Upgrade to Pro to unlock custom branded domains
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#1C2411', lineHeight: 1.6 }}>
                Build customer trust and boost click-through rates by up to 34% with branded domains like <strong>link.yourbrand.in/promo</strong> instead of generic shorteners. Pro includes 1 domain, while Agency includes 5 domains.
              </Typography>
            </Box>
            <Button
              variant="contained"
              disableElevation
              disableRipple
              onClick={() => setBillingOpen(true)}
              sx={{
                bgcolor: '#1C2411',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5,
                '&:hover': { bgcolor: '#000000' },
              }}
            >
              View Pro & Agency plans
            </Button>
          </Box>
        </Card>
      )}

      {/* Domains List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={32} />
        </Box>
      ) : !domains || domains.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', border: '1px solid #E4E9DC', borderRadius: 3, boxShadow: 'none' }}>
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
            <Globe size={28} color="#587529" />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1C2411' }}>
            No branded domains connected yet
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 480, mx: 'auto', mb: 3, lineHeight: 1.6 }}>
            Connect your domain, configure the DNS CNAME record, and start publishing verified branded short links today.
          </Typography>
          <Button
            variant="contained"
            disableElevation
            disableRipple
            startIcon={<Plus size={16} />}
            onClick={() => {
              if (isFreePlan || isAtLimit) {
                setBillingOpen(true);
              } else {
                setConnectOpen(true);
              }
            }}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Connect your first domain
          </Button>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {domains.map((dom) => {
            const isActive = dom.status === 'ACTIVE' || dom.status === 'VERIFIED';
            return (
              <Card
                key={dom.id}
                sx={{
                  p: { xs: 2.5, sm: 3.5 },
                  border: '1px solid #E4E9DC',
                  borderRadius: 3,
                  boxShadow: 'none',
                  bgcolor: '#ffffff',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                    mb: 3,
                    pb: 2,
                    borderBottom: '1px solid #E4E9DC',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2,
                        bgcolor: isActive ? 'rgba(113, 149, 30, 0.12)' : 'rgba(244, 190, 56, 0.15)',
                        color: isActive ? '#71951E' : '#B8860B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Globe size={22} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1C2411' }}>
                        {dom.hostname}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Added on {new Date(dom.createdAt).toLocaleDateString()} &bull; {dom.linksCount ?? 0} active links
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Chip
                      icon={isActive ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                      label={isActive ? 'Active & Verified' : 'DNS Pending'}
                      color={isActive ? 'success' : 'warning'}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />

                    <Button
                      variant="outlined"
                      size="small"
                      disableElevation
                      disableRipple
                      startIcon={verifyMutation.isPending ? <CircularProgress size={14} /> : <RefreshCw size={14} />}
                      disabled={verifyMutation.isPending}
                      onClick={() => verifyMutation.mutate(dom.id)}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Verify DNS
                    </Button>

                    <Tooltip title="Delete domain">
                      <IconButton
                        size="small"
                        disableRipple
                        color="error"
                        onClick={() => setDeleteTarget(dom)}
                        sx={{ border: '1px solid #E4E9DC' }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* DNS Instructions Grid */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1C2411' }}>
                  DNS Configuration Records
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontSize: '0.85rem' }}>
                  Add either the CNAME record or the TXT challenge in your DNS management provider (Cloudflare, GoDaddy, Namecheap):
                </Typography>

                <Grid container spacing={2}>
                  {/* Option 1: CNAME Record */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, bgcolor: '#FBFBFA', borderRadius: 2, border: '1px solid #E4E9DC' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                          RECORD 1: CNAME (RECOMMENDED)
                        </Typography>
                        <Chip label="Routing" size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 20 }} />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Host / Name:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <code style={{ fontSize: '0.8rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>
                              {dom.hostname.split('.')[0]}
                            </code>
                            <IconButton size="small" disableRipple onClick={() => handleCopy(`cname-host-${dom.id}`, dom.hostname.split('.')[0])}>
                              {copiedKey === `cname-host-${dom.id}` ? <Check size={12} color="#71951E" /> : <Copy size={12} />}
                            </IconButton>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Target / Value:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <code style={{ fontSize: '0.8rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>
                              {dom.cnameTarget}
                            </code>
                            <IconButton size="small" disableRipple onClick={() => handleCopy(`cname-val-${dom.id}`, dom.cnameTarget)}>
                              {copiedKey === `cname-val-${dom.id}` ? <Check size={12} color="#71951E" /> : <Copy size={12} />}
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Option 2: TXT Challenge */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, bgcolor: '#FBFBFA', borderRadius: 2, border: '1px solid #E4E9DC' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                          RECORD 2: TXT CHALLENGE (VERIFICATION)
                        </Typography>
                        <Chip label="Ownership" size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 20 }} />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Host / Name:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <code style={{ fontSize: '0.8rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>
                              _urlref-challenge.{dom.hostname}
                            </code>
                            <IconButton size="small" disableRipple onClick={() => handleCopy(`txt-host-${dom.id}`, `_urlref-challenge.${dom.hostname}`)}>
                              {copiedKey === `txt-host-${dom.id}` ? <Check size={12} color="#71951E" /> : <Copy size={12} />}
                            </IconButton>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Value:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <code style={{ fontSize: '0.8rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>
                              urlref-verification={dom.verificationToken}
                            </code>
                            <IconButton size="small" disableRipple onClick={() => handleCopy(`txt-val-${dom.id}`, `urlref-verification=${dom.verificationToken}`)}>
                              {copiedKey === `txt-val-${dom.id}` ? <Check size={12} color="#71951E" /> : <Copy size={12} />}
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                {dom.custom404Url && (
                  <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed #E4E9DC', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Custom 404 Fallback URL:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {dom.custom404Url}
                    </Typography>
                  </Box>
                )}
              </Card>
            );
          })}
        </Box>
      )}

      {/* Connect Domain Dialog */}
      <Dialog open={connectOpen} onClose={() => setConnectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Connect Custom Domain</DialogTitle>
        <Box component="form" onSubmit={handleCreateSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Domain Hostname"
              placeholder="e.g. go.yourcompany.com or links.brand.in"
              required
              fullWidth
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              helperText="Do not include http:// or https://. Subdomains (like go.domain.com) are recommended."
              disabled={createMutation.isPending}
            />

            <TextField
              label="Custom 404 Redirect URL (Optional)"
              placeholder="https://yourcompany.com/not-found"
              fullWidth
              value={custom404Url}
              onChange={(e) => setCustom404Url(e.target.value)}
              helperText="Where visitors should be sent if a short link does not exist on this domain."
              disabled={createMutation.isPending}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setConnectOpen(false)} color="inherit" disableElevation disableRipple sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disableElevation
              disableRipple
              disabled={createMutation.isPending || !hostname.trim()}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              {createMutation.isPending ? 'Connecting...' : 'Connect domain'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Remove Domain?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Are you sure you want to remove <strong>{deleteTarget?.hostname}</strong>? Short links pointing through this domain will revert to using the default platform domain.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit" disableElevation disableRipple sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disableElevation
            disableRipple
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            disabled={deleteMutation.isPending}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Billing Modal for Upgrades */}
      <BillingModal
        open={billingOpen}
        onClose={() => setBillingOpen(false)}
        subscription={subscription}
      />
    </Box>
  );
};
