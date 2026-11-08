import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { SignUp, ClerkLoading, ClerkLoaded } from '@clerk/react';
import { Link2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthLoader } from '../components/auth/AuthLoader';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Create Free Account — URLRef Softics';
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        px: 2,
        py: 6,
      }}
    >
      <Box
        onClick={() => navigate('/')}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 3,
          cursor: 'pointer',
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '9px',
            bgcolor: '#587529',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          <Link2 size={24} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1C2411' }}>
          URLRef
        </Typography>
      </Box>

      {/* Loading animation while Clerk registration assets / forms load */}
      <ClerkLoading>
        <AuthLoader mode="signup" />
      </ClerkLoading>

      {/* Actual Sign-up / OTP form once loaded */}
      <ClerkLoaded>
        <SignUp
          routing="path"
          path="/register"
          signInUrl="/login"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: {
                width: '100%',
                maxWidth: 440,
                display: 'flex',
                justifyContent: 'center',
              },
              card: {
                border: '1px solid #E4E9DC',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                borderRadius: '9px', // Minimal rounded corner matching UI design
                backgroundColor: '#ffffff',
              },
              formButtonPrimary: {
                backgroundColor: '#587529',
                fontSize: '0.95rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '9px',
                '&:hover': {
                  backgroundColor: '#4B6423',
                },
              },
              socialButtonsBlockButton: {
                borderColor: '#E4E9DC',
                borderRadius: '9px',
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 500,
              },
              footerActionLink: {
                color: '#587529',
                fontWeight: 600,
              },
            },
            variables: {
              colorPrimary: '#587529',
              fontFamily: 'Manrope, sans-serif',
              borderRadius: '9px',
            },
          }}
        />
      </ClerkLoaded>

      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1, color: '#556345' }}>
        <ShieldCheck size={16} color="#71951E" />
        <Typography variant="caption" sx={{ color: '#556345', fontWeight: 500 }}>
          10 free links every month &bull; Dynamic QR codes &bull; Instant setup &bull; No credit card required
        </Typography>
      </Box>
    </Box>
  );
};
