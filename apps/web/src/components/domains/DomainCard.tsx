import React from 'react';
import {
  Card,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Globe,
  CheckCircle2,
  Clock,
  RefreshCw,
  Trash2,
  Check,
  Copy,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
} from 'lucide-react';
import { CustomDomainDto } from '@shortener/shared';

interface DomainCardProps {
  dom: CustomDomainDto;
  copiedKey: string | null;
  onCopy: (key: string, text: string) => void;
  onVerify: (id: string) => void;
  isVerifying: boolean;
  onDelete: (dom: CustomDomainDto) => void;
}

export const DomainCard: React.FC<DomainCardProps> = ({
  dom,
  copiedKey,
  onCopy,
  onVerify,
  isVerifying,
  onDelete,
}) => {
  const isDnsActive = dom.status === 'ACTIVE' || dom.status === 'VERIFIED';
  const isDnsFailed = dom.status === 'FAILED';
  const isSslActive = dom.sslStatus === 'active';
  const isSslFailed = dom.sslStatus === 'failed';

  const cnameHost = dom.hostname.split('.')[0];
  const txtHost = `_urlref-challenge.${dom.hostname}`;
  const txtValue = `urlref-verification=${dom.verificationToken}`;

  return (
    <Card
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        border: '1px solid #E4E9DC',
        borderRadius: 1.25,
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
              bgcolor: isDnsActive ? 'rgba(113, 149, 30, 0.12)' : 'rgba(244, 190, 56, 0.15)',
              color: isDnsActive ? '#71951E' : '#B8860B',
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
          {/* DNS Status Badge */}
          {isDnsActive ? (
            <Chip
              icon={<CheckCircle2 size={14} />}
              label="DNS Active"
              color="success"
              size="small"
              sx={{ fontWeight: 700 }}
            />
          ) : isDnsFailed ? (
            <Chip
              icon={<AlertTriangle size={14} />}
              label="DNS Failed"
              color="error"
              size="small"
              sx={{ fontWeight: 700 }}
            />
          ) : (
            <Chip
              icon={<Clock size={14} />}
              label="DNS Pending"
              color="warning"
              size="small"
              sx={{ fontWeight: 700 }}
            />
          )}

          {/* SSL Status Indicator */}
          {isSslActive ? (
            <Chip
              icon={<ShieldCheck size={14} />}
              label="SSL Secured"
              color="success"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 700, borderColor: '#71951E', color: '#587529' }}
            />
          ) : isSslFailed ? (
            <Chip
              icon={<ShieldX size={14} />}
              label="SSL Error"
              color="error"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 700 }}
            />
          ) : (
            <Chip
              icon={<ShieldAlert size={14} />}
              label="SSL Generating"
              color="warning"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 700 }}
            />
          )}

          <Button
            variant="outlined"
            size="small"
            disableElevation
            disableRipple
            startIcon={isVerifying ? <CircularProgress size={14} /> : <RefreshCw size={14} />}
            disabled={isVerifying}
            onClick={() => onVerify(dom.id)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {isVerifying ? 'Verifying...' : 'Re-verify'}
          </Button>

          <Tooltip title="Delete domain">
            <IconButton
              size="small"
              disableRipple
              color="error"
              onClick={() => onDelete(dom)}
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>Host / Name:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, maxWidth: '100%' }}>
                  <code style={{ fontSize: '0.8rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, wordBreak: 'break-all' }}>
                    {cnameHost}
                  </code>
                  <IconButton size="small" disableRipple onClick={() => onCopy(`cname-host-${dom.id}`, cnameHost)}>
                    {copiedKey === `cname-host-${dom.id}` ? <Check size={12} color="#71951E" /> : <Copy size={12} />}
                  </IconButton>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>Target / Value:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, maxWidth: '100%' }}>
                  <code style={{ fontSize: '0.8rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, wordBreak: 'break-all' }}>
                    {dom.cnameTarget}
                  </code>
                  <IconButton size="small" disableRipple onClick={() => onCopy(`cname-val-${dom.id}`, dom.cnameTarget)}>
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>Host / Name:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, maxWidth: '100%' }}>
                  <code style={{ fontSize: '0.8rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, wordBreak: 'break-all' }}>
                    {txtHost}
                  </code>
                  <IconButton size="small" disableRipple onClick={() => onCopy(`txt-host-${dom.id}`, txtHost)}>
                    {copiedKey === `txt-host-${dom.id}` ? <Check size={12} color="#71951E" /> : <Copy size={12} />}
                  </IconButton>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>Value:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, maxWidth: '100%' }}>
                  <code style={{ fontSize: '0.8rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, wordBreak: 'break-all' }}>
                    {txtValue}
                  </code>
                  <IconButton size="small" disableRipple onClick={() => onCopy(`txt-val-${dom.id}`, txtValue)}>
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
};
