import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

const DRAWER_WIDTH = 240;

export const AppLayout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Navbar />
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <Sidebar drawerWidth={DRAWER_WIDTH} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 4 },
            width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};
