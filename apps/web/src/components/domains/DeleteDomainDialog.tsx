import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from '@mui/material';
import { CustomDomainDto } from '@shortener/shared';

interface DeleteDomainDialogProps {
  target: CustomDomainDto | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export const DeleteDomainDialog: React.FC<DeleteDomainDialogProps> = ({
  target,
  onClose,
  onConfirm,
  isPending,
}) => {
  return (
    <Dialog open={Boolean(target)} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Remove Domain?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Are you sure you want to remove <strong>{target?.hostname}</strong>? Short links pointing through this domain will revert to using the default platform domain.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit" disableElevation disableRipple sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          color="error"
          variant="contained"
          disableElevation
          disableRipple
          onClick={onConfirm}
          disabled={isPending}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {isPending ? 'Deleting...' : 'Remove'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
