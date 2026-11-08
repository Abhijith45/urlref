import React from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Button,
  Box,
  IconButton,
  Link as MuiLink,
} from '@mui/material';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LeadCaptureModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

// Rebrandly Style Floating QR Vector Graphic (Matching Image 1)
const FloatingQrIllustration: React.FC = () => (
  <Box
    sx={{
      width: 120,
      height: 120,
      mx: 'auto',
      mb: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}
  >
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background Soft Circle */}
      <circle cx="60" cy="60" r="48" fill="#F4F7EE" />

      {/* Radiating Sparkles / Rays */}
      <line x1="60" y1="4" x2="60" y2="10" stroke="#F4BE38" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="78" y1="12" x2="82" y2="17" stroke="#F4BE38" strokeWidth="2" strokeLinecap="round" />
      <line x1="94" y1="26" x2="99" y2="30" stroke="#F4BE38" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="42" x2="10" y2="40" stroke="#F4BE38" strokeWidth="2" strokeLinecap="round" />
      <line x1="102" y1="72" x2="108" y2="74" stroke="#F4BE38" strokeWidth="2" strokeLinecap="round" />

      {/* Main Floating QR Card (Center isometric/tilted) */}
      <g transform="rotate(-6 60 58)">
        <rect x="36" y="32" width="48" height="48" rx="8" fill="#ffffff" stroke="#E4E9DC" strokeWidth="1.5" />
        {/* Finder Pattern Top-Left */}
        <rect x="42" y="38" width="12" height="12" rx="2" fill="#587529" />
        <rect x="45" y="41" width="6" height="6" fill="#ffffff" />
        <rect x="46.5" y="42.5" width="3" height="3" fill="#587529" />

        {/* Finder Pattern Top-Right */}
        <rect x="66" y="38" width="12" height="12" rx="2" fill="#587529" />
        <rect x="69" y="41" width="6" height="6" fill="#ffffff" />
        <rect x="70.5" y="42.5" width="3" height="3" fill="#587529" />

        {/* Finder Pattern Bottom-Left */}
        <rect x="42" y="62" width="12" height="12" rx="2" fill="#587529" />
        <rect x="45" y="65" width="6" height="6" fill="#ffffff" />
        <rect x="46.5" y="66.5" width="3" height="3" fill="#587529" />

        {/* Center QR Data Modules */}
        <rect x="58" y="40" width="4" height="4" rx="1" fill="#71951E" />
        <rect x="58" y="48" width="4" height="8" rx="1" fill="#587529" />
        <rect x="66" y="54" width="4" height="4" rx="1" fill="#71951E" />
        <rect x="74" y="58" width="4" height="8" rx="1" fill="#587529" />
        <rect x="58" y="66" width="8" height="4" rx="1" fill="#587529" />
        <rect x="68" y="66" width="6" height="6" rx="1" fill="#71951E" />
      </g>

      {/* Floating Mini Badge 1 (Top-Left) */}
      <circle cx="28" cy="38" r="14" fill="#71951E" />
      <rect x="23" y="33" width="4" height="4" fill="#ffffff" rx="0.5" />
      <rect x="29" y="33" width="4" height="4" fill="#ffffff" rx="0.5" />
      <rect x="23" y="39" width="4" height="4" fill="#ffffff" rx="0.5" />
      <rect x="29" y="39" width="4" height="4" fill="#ffffff" rx="0.5" />

      {/* Floating Mini Badge 2 (Bottom-Right) */}
      <circle cx="92" cy="84" r="11" fill="#EDDA5E" />
      <rect x="88" y="80" width="3" height="3" fill="#587529" rx="0.5" />
      <rect x="93" y="80" width="3" height="3" fill="#587529" rx="0.5" />
      <rect x="88" y="85" width="3" height="3" fill="#587529" rx="0.5" />
      <rect x="93" y="85" width="3" height="3" fill="#587529" rx="0.5" />
    </svg>
  </Box>
);

export const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({
  open,
  onClose,
  title = 'Need more QR codes?',
  subtitle = 'URLRef is the right solution for you! Sign up for free now and unlock many more features.',
}) => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    onClose();
    navigate('/register');
  };

  const handleSignIn = () => {
    onClose();
    navigate('/login');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            p: { xs: 2.5, sm: 3.5 },
            textAlign: 'center',
            position: 'relative',
            border: '1px solid #E4E9DC',
            bgcolor: '#ffffff',
            boxShadow: '0 20px 40px -15px rgba(88, 117, 41, 0.2)',
          },
        },
      }}
    >
      <IconButton
        onClick={onClose}
        size="small"
        disableRipple
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: '#556345',
          bgcolor: '#FBFBFA',
          border: '1px solid #E4E9DC',
          '&:hover': { bgcolor: '#F4F6F0' },
        }}
      >
        <X size={18} />
      </IconButton>

      <DialogContent sx={{ p: 0, pt: 1 }}>
        {/* Rebrandly Style Vector Illustration */}
        <FloatingQrIllustration />

        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1C2411', mb: 1.2, letterSpacing: '-0.02em', textWrap: 'balance' }}>
          {title}
        </Typography>

        <Typography variant="body2" sx={{ color: '#556345', mb: 2.5, lineHeight: 1.6, px: 1, textWrap: 'pretty' }}>
          {subtitle}
        </Typography>

        {/* High Converting Free Plan Highlight (Matching Rebrandly Image 1) */}
        <Box
          sx={{
            p: 2,
            mb: 2.5,
            bgcolor: '#FBFBFA',
            borderRadius: 2.5,
            border: '1px solid #E4E9DC',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: '#1C2411', lineHeight: 1.6, fontWeight: 500 }}>
            With our <strong>free plan</strong> you will get access up to <strong>10 links and dynamic QR codes</strong> each month, one for each branded link generated.
          </Typography>
        </Box>

        {/* Loss Aversion Callout (Matching Rebrandly Image 1) */}
        <Typography variant="caption" sx={{ color: '#556345', display: 'block', mb: 3, px: 2, lineHeight: 1.5 }}>
          Your shortened links and QR codes will automatically be imported into your new account
        </Typography>

        {/* Primary CTA Button (High Contrast Solid Black / Dark Olive) */}
        <Button
          variant="contained"
          fullWidth
          disableElevation
          disableRipple
          onClick={handleSignUp}
          sx={{
            py: 1.4,
            borderRadius: 2.5,
            fontSize: '1rem',
            fontWeight: 700,
            textTransform: 'none',
            bgcolor: '#1C2411',
            color: '#ffffff',
            mb: 2,
            '&:hover': {
              bgcolor: '#000000',
            },
          }}
        >
          Sign up for free
        </Button>

        {/* Secondary Login Action */}
        <Typography variant="body2" sx={{ color: '#556345' }}>
          Already have an account?{' '}
          <MuiLink
            component="button"
            onClick={handleSignIn}
            sx={{ fontWeight: 700, color: '#587529', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Sign in
          </MuiLink>
        </Typography>
      </DialogContent>
    </Dialog>
  );
};
