import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import { Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import { CustomDomainDto, SubscriptionStatusDto } from '@shortener/shared';
import { BillingModal } from '../components/billing/BillingModal';
import { DomainCard } from '../components/domains/DomainCard';
import { ConnectDomainDialog } from '../components/domains/ConnectDomainDialog';
import { DomainUpgradeBanner } from '../components/domains/DomainUpgradeBanner';
import { DomainEmptyState } from '../components/domains/DomainEmptyState';
import { DeleteDomainDialog } from '../components/domains/DeleteDomainDialog';
import { toast } from 'react-toastify';

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
        toast.success('Domain verified successfully! It is now active for short links.');
      } else {
        toast.info(data.meta?.verification?.message || 'DNS verification still pending. Please allow time for DNS propagation.');
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Verification failed');
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
      toast.success('Domain removed successfully.');
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to delete domain');
    },
  });

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard!');
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
      {isFreePlan && <DomainUpgradeBanner onUpgrade={() => setBillingOpen(true)} />}

      {/* Domains List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={32} />
        </Box>
      ) : !domains || domains.length === 0 ? (
        <DomainEmptyState
          onConnect={() => {
            if (isFreePlan || isAtLimit) {
              setBillingOpen(true);
            } else {
              setConnectOpen(true);
            }
          }}
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {domains.map((dom) => (
            <DomainCard
              key={dom.id}
              dom={dom}
              copiedKey={copiedKey}
              onCopy={handleCopy}
              onVerify={(id) => verifyMutation.mutate(id)}
              isVerifying={verifyMutation.isPending}
              onDelete={(target) => setDeleteTarget(target)}
            />
          ))}
        </Box>
      )}

      {/* Connect Domain Dialog */}
      <ConnectDomainDialog
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onSubmit={handleCreateSubmit}
        hostname={hostname}
        setHostname={setHostname}
        custom404Url={custom404Url}
        setCustom404Url={setCustom404Url}
        formError={formError}
        isPending={createMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDomainDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isPending={deleteMutation.isPending}
      />

      {/* Billing Modal for Upgrades */}
      <BillingModal
        open={billingOpen}
        onClose={() => setBillingOpen(false)}
        subscription={subscription}
      />
    </Box>
  );
};
