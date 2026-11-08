import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
} from '@mui/material';

interface LegalModalProps {
  open: boolean;
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ open, type, onClose }) => {
  if (!type) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: '#1C2411' }}>
        {type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {type === 'privacy' ? (
          <>
            <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
              At URLRef (a Softics product), we believe privacy is a fundamental standard. Our redirect engine is engineered with strict privacy preservation:
            </Typography>
            <Box component="ul" sx={{ pl: 2.5, m: 0, color: '#556345', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <li>
                <Typography variant="body2">
                  <strong>Zero Raw IP Storage:</strong> We never log, persist, or store raw IP addresses or hardware fingerprints in our databases.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Sanitized Telemetry:</strong> Only coarse geographic country codes (ISO), normalized device categories (desktop, mobile, tablet), and referrer hostnames are recorded.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>No Tracking Cookies on Redirects:</strong> Visitors following your short links receive lightweight HTTP 302 responses without cross-site tracking cookies.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Data Ownership:</strong> You retain complete ownership of your links and analytics. You can export or delete your links anytime.
                </Typography>
              </li>
            </Box>
          </>
        ) : (
          <>
            <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
              By accessing URLRef, you agree to these clear terms of service:
            </Typography>
            <Box component="ul" sx={{ pl: 2.5, m: 0, color: '#556345', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <li>
                <Typography variant="body2">
                  <strong>Permitted Use:</strong> URLRef provides link shortening, branded domain management, and QR code creation for legitimate commercial and personal purposes.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Prohibited Content:</strong> Links redirecting to malware, phishing, illegal scams, spam campaigns, or deceptive pages are strictly prohibited and immediately terminated.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Availability & SLA:</strong> We maintain high availability redirect infrastructure with redundant edge routing.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Subscription Terms:</strong> Paid plans renew automatically per billing cycle (monthly or annually) and can be cancelled anytime with zero penalty.
                </Typography>
              </li>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ pb: 2, px: 3 }}>
        <Button
          variant="contained"
          size="small"
          disableElevation
          disableRipple
          onClick={onClose}
          sx={{
            bgcolor: '#1C2411',
            color: '#ffffff',
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: 2,
            px: 3,
            '&:hover': { bgcolor: '#000000' },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
