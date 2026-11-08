import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import { apiClient } from '../../services/api-client';
import { LinkDto } from '@shortener/shared';

interface DeleteLinkModalProps {
  open: boolean;
  link: LinkDto | null;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
}

export const DeleteLinkModal: React.FC<DeleteLinkModalProps> = ({
  open,
  link,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!link) return;

    setLoading(true);
    setError(null);

    try {
      await apiClient.delete(`/api/v1/links/${link.id}`);
      onSuccess(link.id);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete short link');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!link) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Delete Short Link</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body1">
          Are you sure you want to permanently delete this short link?
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ mt: 1.5, p: 1.5, bgcolor: 'background.default', borderRadius: 1, fontFamily: 'monospace' }}
        >
          /{link.code} &rarr; {link.destinationUrl}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1.5 }}>
          All recorded analytics for this link will also be permanently removed.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading} color="inherit" disableElevation disableRipple sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disableElevation
          disableRipple
          disabled={loading}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
