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
  FormControlLabel,
  Switch,
} from '@mui/material';
import { apiClient } from '../../services/api-client';
import { LinkDto } from '@shortener/shared';
import { toast } from 'react-toastify';
import { UtmBuilderAccordion, UtmValues } from './UtmBuilderAccordion';

interface EditLinkModalProps {
  open: boolean;
  link: LinkDto | null;
  onClose: () => void;
  onSuccess: (updatedLink: LinkDto) => void;
}

interface EditLinkFormProps {
  link: LinkDto;
  onClose: () => void;
  onSuccess: (updatedLink: LinkDto) => void;
}

const EditLinkForm: React.FC<EditLinkFormProps> = ({ link, onClose, onSuccess }) => {
  const [destinationUrl, setDestinationUrl] = useState(link.destinationUrl);
  const [title, setTitle] = useState(link.title || '');
  const [isActive, setIsActive] = useState(link.isActive);
  const [expiresAt, setExpiresAt] = useState(
    link.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : ''
  );
  const [utmParams, setUtmParams] = useState<UtmValues>({
    utmSource: link.utmSource || '',
    utmMedium: link.utmMedium || '',
    utmCampaign: link.utmCampaign || '',
    utmTerm: link.utmTerm || '',
    utmContent: link.utmContent || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        destinationUrl,
        title: title.trim() || undefined,
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        utmSource: utmParams.utmSource?.trim() || null,
        utmMedium: utmParams.utmMedium?.trim() || null,
        utmCampaign: utmParams.utmCampaign?.trim() || null,
        utmTerm: utmParams.utmTerm?.trim() || null,
        utmContent: utmParams.utmContent?.trim() || null,
      };

      const response = await apiClient.patch<{ data: LinkDto }>(`/api/v1/links/${link.id}`, payload);
      onSuccess(response.data.data);
      toast.success('Short link updated successfully!');
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

  return (
    <>
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

          <UtmBuilderAccordion
            value={utmParams}
            destinationUrl={destinationUrl}
            onChange={setUtmParams}
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
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogActions>
      </Box>
    </>
  );
};

export const EditLinkModal: React.FC<EditLinkModalProps> = ({ open, link, onClose, onSuccess }) => {
  if (!open || !link) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <EditLinkForm key={link.id} link={link} onClose={onClose} onSuccess={onSuccess} />
    </Dialog>
  );
};
