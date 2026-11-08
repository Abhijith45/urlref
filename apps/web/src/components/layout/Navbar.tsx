import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import { Link2, LogOut, User as UserIcon, CreditCard, Sparkles, Menu as MenuIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api-client';
import { SubscriptionStatusDto } from '@shortener/shared';
import { BillingModal } from '../billing/BillingModal';

interface NavbarProps {
  onMobileNavToggle?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMobileNavToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [billingOpen, setBillingOpen] = useState(false);

  // Cached subscription query with 10-minute staleTime prevents redundant network calls on route transitions
  const { data: subscription, refetch: refetchSubscription } = useQuery<SubscriptionStatusDto | null>({
    queryKey: ['billing', 'subscription'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: SubscriptionStatusDto }>('/api/v1/billing/subscription');
      return res.data.data;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleCloseUserMenu();
    await logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #E4E9DC',
        color: 'text.primary',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', height: 64, px: { xs: 2, sm: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {user && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={onMobileNavToggle}
              sx={{
                display: { xs: 'inline-flex', md: 'none' },
                minWidth: 44,
                minHeight: 44,
                p: 1,
                color: '#1C2411',
              }}
            >
              <MenuIcon size={22} />
            </IconButton>
          )}

          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: '8px',
                bgcolor: '#587529',
                color: '#ffffff',
              }}
            >
              <Link2 size={20} />
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1C2411', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                URLRef
                <Box component="span" sx={{ fontSize: '0.7rem', bgcolor: '#EDDA5E', color: '#1C2411', px: 0.8, py: 0.2, borderRadius: 1, fontWeight: 700 }}>
                  Softics
                </Box>
              </Typography>
            </Box>
          </Box>
        </Box>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            {/* Plan Badge */}
            <Chip
              label={`${subscription?.tier || 'FREE'} PLAN`}
              size="small"
              sx={{
                bgcolor: subscription?.tier === 'AGENCY' ? '#1C2411' : subscription?.tier === 'PRO' ? '#587529' : 'rgba(237, 218, 94, 0.4)',
                color: subscription?.tier === 'FREE' ? '#587529' : '#ffffff',
                fontWeight: 800,
                fontSize: '0.7rem',
                border: subscription?.tier === 'FREE' ? '1px solid #EDDA5E' : 'none',
                height: 22,
                display: { xs: 'none', sm: 'inline-flex' },
              }}
            />

            {/* Upgrade CTA Button for Free tier users */}
            {(!subscription || subscription.tier === 'FREE') && (
              <Button
                variant="contained"
                size="small"
                disableElevation
                disableRipple
                onClick={() => setBillingOpen(true)}
                startIcon={<Sparkles size={14} color="#F4BE38" />}
                sx={{
                  bgcolor: '#1C2411',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#000000' },
                }}
              >
                Upgrade
              </Button>
            )}

            <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user.email}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {user.role}
              </Typography>
            </Box>

            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0.5 }} disableRipple>
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.9rem' }}>
                {user.email.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseUserMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { width: 220, mt: 1, border: '1px solid #E4E9DC', borderRadius: 2 } } }}
            >
              <MenuItem disabled sx={{ opacity: 0.8 }}>
                <ListItemIcon>
                  <UserIcon size={16} />
                </ListItemIcon>
                <ListItemText
                  primary={user.email}
                  primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                />
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleCloseUserMenu();
                  setBillingOpen(true);
                }}
              >
                <ListItemIcon>
                  <CreditCard size={16} color="#71951E" />
                </ListItemIcon>
                <ListItemText primary="Billing & Plans" primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} />
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogOut size={16} />
                </ListItemIcon>
                <ListItemText primary="Log out" primaryTypographyProps={{ variant: 'body2', color: 'error.main' }} />
              </MenuItem>
            </Menu>

            {/* Stripe Billing Modal */}
            <BillingModal
              open={billingOpen}
              onClose={() => setBillingOpen(false)}
              subscription={subscription}
              onRefresh={() => refetchSubscription()}
            />
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};
