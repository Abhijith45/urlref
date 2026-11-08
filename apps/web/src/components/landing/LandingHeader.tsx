import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Avatar,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Link2,
  QrCode,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface LandingHeaderProps {
  heroMode: 'shortener' | 'qr';
  onModeChange: (mode: 'shortener' | 'qr') => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  heroMode,
  onModeChange,
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 12,
        zIndex: 1100,
        px: { xs: 2, sm: 4 },
      }}
    >
      <Box
        sx={{
          maxWidth: 1120,
          mx: 'auto',
          height: 64,
          px: { xs: 2, sm: 3 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: '1px solid #E4E9DC',
          boxShadow: '0 4px 20px -2px rgba(88, 117, 41, 0.08)',
        }}
      >
        {/* Brand Logo */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '8px',
              bgcolor: '#587529',
              color: '#ffffff',
            }}
          >
            <Link2 size={20} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: '#1C2411' }}>
              URLRef
            </Typography>
            <Chip
              label="Softics"
              size="small"
              sx={{
                bgcolor: '#EDDA5E',
                color: '#587529',
                fontSize: '0.7rem',
                height: 20,
                fontWeight: 700,
                display: { xs: 'none', sm: 'inline-flex' },
              }}
            />
          </Box>
        </Box>

        {/* Mode Switcher Tabs with Scroll Detection */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={heroMode}
            exclusive
            onChange={(_, newMode) => {
              if (newMode) onModeChange(newMode);
            }}
            size="small"
            sx={{
              bgcolor: '#F3F6EC',
              p: '3px',
              borderRadius: '10px',
              border: '1px solid #E4E9DC',
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: '7px !important',
                px: 2,
                py: 0.6,
                fontWeight: 600,
                fontSize: '0.875rem',
                textTransform: 'none',
                color: '#556345',
                transition: 'all 200ms cubic-bezier(0.22, 1, 0.36, 1)',
                '&.Mui-selected': {
                  bgcolor: '#ffffff',
                  color: '#587529',
                  boxShadow: '0 1px 4px rgba(88, 117, 41, 0.12)',
                },
              },
            }}
          >
            <ToggleButton value="shortener">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Link2 size={15} />
                <span>URL Shortener</span>
              </Box>
            </ToggleButton>
            <ToggleButton value="qr">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <QrCode size={15} />
                <span>QR Studio</span>
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* User Auth Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {isAuthenticated && user ? (
            <>
              <Button
                variant="contained"
                color="primary"
                size="small"
                disableElevation
                disableRipple
                onClick={() => navigate('/dashboard')}
                endIcon={<ArrowRight size={15} />}
                sx={{ fontWeight: 600, px: 2, textTransform: 'none' }}
              >
                Dashboard
              </Button>
              <IconButton onClick={() => navigate('/dashboard')} size="small" disableRipple sx={{ p: 0.5 }}>
                <Avatar sx={{ bgcolor: '#587529', width: 32, height: 32, fontSize: '0.8rem' }}>
                  {user.email.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Button
                variant="text"
                color="inherit"
                size="small"
                disableElevation
                disableRipple
                onClick={async () => {
                  await logout();
                }}
                sx={{ color: '#556345', display: { xs: 'none', sm: 'inline-flex' }, textTransform: 'none' }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="text"
                color="inherit"
                size="small"
                disableElevation
                disableRipple
                onClick={() => navigate('/login')}
                sx={{ color: '#556345', fontWeight: 600, textTransform: 'none' }}
              >
                Sign in
              </Button>
              <Button
                variant="contained"
                color="secondary"
                size="small"
                disableElevation
                disableRipple
                onClick={() => navigate('/register')}
                sx={{ fontWeight: 700, px: 2, textTransform: 'none' }}
              >
                Get started
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};
