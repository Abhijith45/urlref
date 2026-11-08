import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { Zap } from 'lucide-react';
import { LinkDto } from '@shortener/shared';

interface QrDynamicOptionProps {
  dynamicLink: LinkDto | null;
  shortening: boolean;
  hasInput: boolean;
  onGenerateDynamic: () => void;
}

export const QrDynamicOption: React.FC<QrDynamicOptionProps> = ({
  dynamicLink,
  shortening,
  hasInput,
  onGenerateDynamic,
}) => {
  return (
    <Box sx={{ mt: 2.5, p: 2, bgcolor: 'rgba(88,117,41,0.06)', borderRadius: 2, border: '1px solid rgba(88,117,41,0.2)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Zap size={16} color="#587529" />
            Dynamic QR Code (Trackable & Editable)
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Update the destination URL anytime after printing without changing the physical QR code.
          </Typography>
        </Box>
        <Button
          variant={dynamicLink ? 'outlined' : 'contained'}
          color="primary"
          size="small"
          disableRipple
          disableElevation
          onClick={onGenerateDynamic}
          disabled={shortening || !hasInput}
          sx={{ textTransform: 'none', fontWeight: 600, ml: 2, whiteSpace: 'nowrap' }}
        >
          {shortening ? <CircularProgress size={16} /> : dynamicLink ? 'Re-link' : 'Make Dynamic'}
        </Button>
      </Box>
      {dynamicLink && (
        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, display: 'block', mt: 1 }}>
          ✓ Dynamic link active: {dynamicLink.shortUrl}
        </Typography>
      )}
    </Box>
  );
};
