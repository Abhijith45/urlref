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
import { LayoutDashboard, Link, BarChart3, QrCode, Sparkles, Globe } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BillingModal } from '../billing/BillingModal';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Links', path: '/dashboard/links', icon: <Link size={20} /> },
  { label: 'QR Studio', path: '/dashboard/qr', icon: <QrCode size={20} /> },
  { label: 'Domains', path: '/dashboard/domains', icon: <Globe size={20} /> },
  { label: 'Analytics', path: '/dashboard/analytics', icon: <BarChart3 size={20} /> },
];

export const Sidebar: React.FC<{ drawerWidth?: number }> = ({ drawerWidth = 240 }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [billingOpen, setBillingOpen] = useState(false);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid #E4E9DC',
          backgroundColor: '#ffffff',
          pt: 10,
        },
      }}
    >
      <Box sx={{ px: 3, pb: 2 }}>
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
                onClick={() => navigate(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  color: isActive ? 'primary.main' : 'text.primary',
                  fontWeight: isActive ? 600 : 500,
                  backgroundColor: isActive ? 'rgba(88, 117, 41, 0.1)' : 'transparent',
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
            onClick={() => setBillingOpen(true)}
            sx={{
              bgcolor: '#1C2411',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'none',
              py: 0.6,
              borderRadius: 1.5,
              '&:hover': { bgcolor: '#000000' },
            }}
          >
            View plans
          </Button>
        </Box>
      </Box>

      <BillingModal open={billingOpen} onClose={() => setBillingOpen(false)} />
    </Drawer>
  );
};
