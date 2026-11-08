import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { apiClient } from '../../services/api-client';
import { LinkDto } from '@shortener/shared';

interface EditLinkModalProps {
  open: boolean;
  link: LinkDto | null;
  onClose: () => void;
  onSuccess: (updatedLink: LinkDto) => void;
}

export const EditLinkModal: React.FC<EditLinkModalProps> = ({ open, link, onClose, onSuccess }) => {
  const [destinationUrl, setDestinationUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (link) {
      setDestinationUrl(link.destinationUrl);
      setTitle(link.title || '');
      setIsActive(link.isActive);
      setExpiresAt(link.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : '');
      setError(null);
    }
  }, [link]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link) return;

    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        destinationUrl,
        title: title.trim() || undefined,
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      const response = await apiClient.patch<{ data: LinkDto }>(`/api/v1/links/${link.id}`, payload);
      onSuccess(response.data.data);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update short link');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!link) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Edit Link: /{link.code}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Destination URL"
            required
            fullWidth
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            disabled={loading}
          />

          <TextField
            label="Title / Note"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />

          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                color="primary"
                disabled={loading}
              />
            }
            label={isActive ? 'Active (redirects enabled)' : 'Disabled (returns 410 Gone)'}
          />

          <TextField
            label="Expiration Date (Optional)"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            fullWidth
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            disabled={loading}
            helperText="Clear to disable automatic expiration"
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
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
