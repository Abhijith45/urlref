import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Sparkles } from 'lucide-react';

interface QrUpsellBannerProps {
  onCreateAnother: () => void;
}

export const QrUpsellBanner: React.FC<QrUpsellBannerProps> = ({ onCreateAnother }) => {
  return (
    <Box
      sx={{
        mt: 4,
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        bgcolor: '#ffffff',
        border: '1px solid #E4E9DC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            bgcolor: 'rgba(88,117,41,0.1)',
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sparkles size={22} />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1C2411' }}>
            Ready to create more QR codes?
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Get started for free and unlock 10 links each month, dynamic editable QRs, and real time scan analytics.
          </Typography>
        </Box>
      </Box>

      <Button
        variant="contained"
        disableElevation
        disableRipple
        onClick={onCreateAnother}
        sx={{
          bgcolor: '#1C2411',
          color: '#ffffff',
          textTransform: 'none',
          fontWeight: 700,
          px: 3,
          py: 1.2,
          borderRadius: 2,
          '&:hover': { bgcolor: '#000000' },
        }}
      >
        Create another QR code
      </Button>
    </Box>
  );
};
