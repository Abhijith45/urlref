import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Alert,
} from '@mui/material';

interface ConnectDomainDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  hostname: string;
  setHostname: (val: string) => void;
  custom404Url: string;
  setCustom404Url: (val: string) => void;
  formError: string | null;
  isPending: boolean;
}

export const ConnectDomainDialog: React.FC<ConnectDomainDialogProps> = ({
  open,
  onClose,
  onSubmit,
  hostname,
  setHostname,
  custom404Url,
  setCustom404Url,
  formError,
  isPending,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Connect Custom Domain</DialogTitle>
      <Box component="form" onSubmit={onSubmit}>
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
            disabled={isPending}
          />

          <TextField
            label="Custom 404 Redirect URL (Optional)"
            placeholder="https://yourcompany.com/not-found"
            fullWidth
            value={custom404Url}
            onChange={(e) => setCustom404Url(e.target.value)}
            helperText="Where visitors should be sent if a short link does not exist on this domain."
            disabled={isPending}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} color="inherit" disableElevation disableRipple sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disableElevation
            disableRipple
            disabled={isPending || !hostname.trim()}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {isPending ? 'Connecting...' : 'Connect domain'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
