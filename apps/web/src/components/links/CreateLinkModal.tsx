import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api-client';
import { LinkDto, CustomDomainDto } from '@shortener/shared';

interface CreateLinkModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (link: LinkDto) => void;
}

export const CreateLinkModal: React.FC<CreateLinkModalProps> = ({ open, onClose, onSuccess }) => {
  const [destinationUrl, setDestinationUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch verified user custom domains
  const { data: domains } = useQuery<CustomDomainDto[]>({
    queryKey: ['domains'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: CustomDomainDto[] }>('/api/v1/domains');
      return res.data.data;
    },
    enabled: open,
  });

  const activeDomains = domains?.filter((d) => d.status === 'ACTIVE' || d.status === 'VERIFIED') || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        destinationUrl,
        title: title.trim() || undefined,
        customAlias: customAlias.trim() || undefined,
        customDomainId: selectedDomainId || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      };

      const response = await apiClient.post<{ data: LinkDto }>('/api/v1/links', payload);
      onSuccess(response.data.data);
      onClose();
      // Reset form
      setDestinationUrl('');
      setCustomAlias('');
      setTitle('');
      setSelectedDomainId('');
      setExpiresAt('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create short link');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Create New Short Link</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Destination URL"
            placeholder="https://example.com/target-page"
            required
            fullWidth
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            disabled={loading}
          />

          {activeDomains.length > 0 && (
            <FormControl fullWidth size="medium">
              <InputLabel id="domain-select-label">Short Link Domain</InputLabel>
              <Select
                labelId="domain-select-label"
                value={selectedDomainId}
                label="Short Link Domain"
                onChange={(e) => setSelectedDomainId(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>urlref.softics.in (Default)</em>
                </MenuItem>
                {activeDomains.map((dom) => (
                  <MenuItem key={dom.id} value={dom.id}>
                    {dom.hostname}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            label="Title / Campaign Note (Optional)"
            placeholder="e.g. Summer Promo 2026"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />

          <TextField
            label="Custom Alias (Optional)"
            placeholder="e.g. promo26"
            fullWidth
            value={customAlias}
            onChange={(e) => setCustomAlias(e.target.value)}
            disabled={loading}
            helperText={
              selectedDomainId && activeDomains.find((d) => d.id === selectedDomainId)
                ? `Will be published as https://${activeDomains.find((d) => d.id === selectedDomainId)?.hostname}/${customAlias || '<code\>'}`
                : 'Leave empty for auto-generated Base62 code'
            }
          />

          <TextField
            label="Expiration Date (Optional)"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            fullWidth
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} disabled={loading} color="inherit" disableElevation disableRipple sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disableElevation
            disableRipple
            disabled={loading || !destinationUrl}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {loading ? 'Creating...' : 'Create link'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
