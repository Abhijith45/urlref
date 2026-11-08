import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { Link2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LandingFooterProps {
  onOpenLegalModal: (type: 'privacy' | 'terms') => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onOpenLegalModal }) => {
  const navigate = useNavigate();

  return (
    <Box component="footer" sx={{ py: 4, bgcolor: '#111709', color: '#556345', borderTop: '1px solid #233014' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '6px',
                bgcolor: '#587529',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Link2 size={16} />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff' }}>
              URLRef
            </Typography>
            <Typography variant="caption" sx={{ color: '#EDDA5E' }}>
              by Softics
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, fontSize: '0.875rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Box
              component="a"
              href="/solutions/agencies"
              onClick={(e) => {
                e.preventDefault();
                navigate('/solutions/agencies');
              }}
              sx={{ color: '#EDDA5E', textDecoration: 'none', '&:hover': { color: '#ffffff' }, cursor: 'pointer' }}
            >
              For Agencies
            </Box>
            <Box
              component="a"
              href="/solutions/bulk-dynamic-qr"
              onClick={(e) => {
                e.preventDefault();
                navigate('/solutions/bulk-dynamic-qr');
              }}
              sx={{ color: '#EDDA5E', textDecoration: 'none', '&:hover': { color: '#ffffff' }, cursor: 'pointer' }}
            >
              Packaging QRs
            </Box>
            <Box
              component="a"
              href="/tools/upi-qr-generator"
              onClick={(e) => {
                e.preventDefault();
                navigate('/tools/upi-qr-generator');
              }}
              sx={{ color: '#EDDA5E', textDecoration: 'none', '&:hover': { color: '#ffffff' }, cursor: 'pointer' }}
            >
              UPI QR Maker
            </Box>
            <Box
              component="a"
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
              sx={{ color: '#EDDA5E', textDecoration: 'none', '&:hover': { color: '#ffffff' }, cursor: 'pointer' }}
            >
              Sign in
            </Box>
            <Box
              component="a"
              href="/register"
              onClick={(e) => {
                e.preventDefault();
                navigate('/register');
              }}
              sx={{ color: '#EDDA5E', textDecoration: 'none', '&:hover': { color: '#ffffff' }, cursor: 'pointer' }}
            >
              Register
            </Box>
            <Box
              component="button"
              onClick={() => onOpenLegalModal('privacy')}
              sx={{
                background: 'none',
                border: 'none',
                p: 0,
                color: '#556345',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
                '&:hover': { color: '#ffffff' },
              }}
            >
              Privacy policy
            </Box>
            <Box
              component="button"
              onClick={() => onOpenLegalModal('terms')}
              sx={{
                background: 'none',
                border: 'none',
                p: 0,
                color: '#556345',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
                '&:hover': { color: '#ffffff' },
              }}
            >
              Terms of service
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
