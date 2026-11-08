import React from 'react';
import { Box, Typography, CircularProgress, Skeleton } from '@mui/material';
import { ShieldCheck, Lock } from 'lucide-react';

interface AuthLoaderProps {
  mode?: 'signin' | 'signup' | 'otp';
}

export const AuthLoader: React.FC<AuthLoaderProps> = ({ mode = 'signin' }) => {
  const title =
    mode === 'signup'
      ? 'Setting up registration...'
      : mode === 'otp'
      ? 'Verifying code...'
      : 'Loading secure sign in...';

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 440,
        minHeight: 460,
        bgcolor: '#ffffff',
        border: '1px solid #E4E9DC',
        borderRadius: '9px', // Minimal rounded corner matching UI design
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        p: { xs: 3, sm: 4 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top subtle decorative gradient bar */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #587529, #F4BE38, #71951E)',
        }}
      />

      {/* Pulsing Shield Icon Container */}
      <Box
        sx={{
          width: 54,
          height: 54,
          borderRadius: '9px',
          bgcolor: 'rgba(88, 117, 41, 0.08)',
          border: '1px solid rgba(88, 117, 41, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#587529',
          mb: 2.5,
          position: 'relative',
        }}
      >
        <Lock size={22} color="#587529" />
        <CircularProgress
          size={52}
          thickness={2.5}
          sx={{
            color: '#587529',
            position: 'absolute',
            top: 1,
            left: 1,
          }}
        />
      </Box>

      {/* Typography */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: '#1C2411',
          fontSize: '1.05rem',
          mb: 0.5,
          textAlign: 'center',
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: '#556345',
          fontSize: '0.8rem',
          mb: 3.5,
          textAlign: 'center',
        }}
      >
        Connecting to URLRef authentication service
      </Typography>

      {/* Skeleton placeholders mimicking the auth inputs */}
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.75, mb: 2 }}>
        <Skeleton
          variant="rounded"
          height={42}
          sx={{
            borderRadius: '9px',
            bgcolor: '#F4F7EE',
            transform: 'none',
          }}
        />
        <Skeleton
          variant="rounded"
          height={42}
          sx={{
            borderRadius: '9px',
            bgcolor: '#F4F7EE',
            transform: 'none',
          }}
        />
        <Skeleton
          variant="rounded"
          height={44}
          sx={{
            borderRadius: '9px',
            bgcolor: 'rgba(88, 117, 41, 0.15)',
            transform: 'none',
            mt: 0.5,
          }}
        />
      </Box>

      {/* Bottom Security Note */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#556345', mt: 1 }}>
        <ShieldCheck size={14} color="#71951E" />
        <Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#556345' }}>
          Encrypted 256 bit SSL handshake
        </Typography>
      </Box>
    </Box>
  );
};
