import React, { useEffect } from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { QrStudio } from '../components/qr/QrStudio';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../services/query-keys';
import { LinkDto } from '@shortener/shared';

export const DashboardQrPage: React.FC = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = 'QR Studio — URLRef Softics';
  }, []);

  const handleDynamicLinkCreated = (_link: LinkDto) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.links.all });
    queryClient.invalidateQueries({ queryKey: ['links', 'quota'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: '#1C2411' }}>
          QR Studio
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Design custom branded QR codes for web links, WhatsApp, and UPI payments with real time tracking.
        </Typography>
      </Box>

      <Card sx={{ bgcolor: '#ffffff', borderRadius: 1.25, border: '1px solid #E4E9DC', boxShadow: 'none' }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
          <QrStudio onDynamicLinkCreated={handleDynamicLinkCreated} />
        </CardContent>
      </Card>
    </Box>
  );
};
