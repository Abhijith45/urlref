import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Button,
} from '@mui/material';
import { LayoutDashboard, Link, BarChart3, QrCode, Sparkles, Globe, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../services/query-keys';
import { apiClient } from '../../services/api-client';
import { BillingModal } from '../billing/BillingModal';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Links', path: '/dashboard/links', icon: <Link size={20} /> },
  { label: 'QR Studio', path: '/dashboard/qr', icon: <QrCode size={20} /> },
  { label: 'Domains', path: '/dashboard/domains', icon: <Globe size={20} /> },
  { label: 'Analytics', path: '/dashboard/analytics', icon: <BarChart3 size={20} /> },
  { label: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} /> },
];

interface SidebarProps {
  drawerWidth?: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  drawerWidth = 240,
  mobileOpen = false,
  onMobileClose,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [billingOpen, setBillingOpen] = useState(false);

  // Intelligent hover prefetching: pulls route data into cache before click
  const handlePrefetch = (path: string) => {
    if (path === '/dashboard' || path === '/dashboard/analytics') {
      queryClient.prefetchQuery({
        queryKey: queryKeys.analytics.overview(),
        queryFn: async () => {
          const res = await apiClient.get('/api/v1/analytics/overview');
          return res.data.data;
        },
      });
    }
    if (path === '/dashboard' || path === '/dashboard/links') {
      queryClient.prefetchQuery({
        queryKey: queryKeys.links.list({ page: 1, limit: path === '/dashboard' ? 5 : 10 }),
        queryFn: async () => {
          const res = await apiClient.get(`/api/v1/links?page=1&limit=${path === '/dashboard' ? 5 : 10}`);
          return res.data;
        },
      });
    }
    if (path === '/dashboard/domains') {
      queryClient.prefetchQuery({
        queryKey: ['domains'],
        queryFn: async () => {
          const res = await apiClient.get('/api/v1/domains');
          return res.data.data;
        },
      });
    }
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 3, pb: 2, pt: { xs: 2, md: 0 } }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', letterSpacing: '0.05em' }}>
          Navigation
        </Typography>
      </Box>
      <List sx={{ px: 1.5 }}>
        {navItems.map((item) => {
          const isActive =
            item.path === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(item.path);

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  onMobileClose?.();
                }}
                onMouseEnter={() => handlePrefetch(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  color: isActive ? 'primary.main' : 'text.primary',
                  fontWeight: isActive ? 600 : 500,
                  backgroundColor: isActive ? 'rgba(88, 117, 41, 0.1)' : 'transparent',
                  minHeight: 44,
                  '&:hover': {
                    backgroundColor: isActive ? 'rgba(88, 117, 41, 0.16)' : 'rgba(88, 117, 41, 0.05)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isActive ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ mt: 'auto', p: 2 }}>
        <Box
          sx={{
            p: 2,
            bgcolor: 'rgba(237, 218, 94, 0.25)',
            border: '1px solid #EDDA5E',
            borderRadius: 2.5,
            textAlign: 'left',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Sparkles size={16} color="#71951E" />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#587529' }}>
              Pro & Agency
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#1C2411', mb: 1.5, lineHeight: 1.4 }}>
            Unlock 100+ dynamic QRs and custom branded domains.
          </Typography>
          <Button
            variant="contained"
            size="small"
            fullWidth
            disableElevation
            disableRipple
            onClick={() => {
              setBillingOpen(true);
              onMobileClose?.();
            }}
            sx={{
              bgcolor: '#1C2411',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'none',
              py: 0.8,
              minHeight: 38,
              borderRadius: 1.5,
              '&:hover': { bgcolor: '#000000' },
            }}
          >
            View plans
          </Button>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile temporary drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid #E4E9DC',
            backgroundColor: '#ffffff',
            pt: 2,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid #E4E9DC',
            backgroundColor: '#ffffff',
            pt: 10,
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      <BillingModal open={billingOpen} onClose={() => setBillingOpen(false)} />
    </>
  );
};
