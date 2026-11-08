import React from 'react';
import { Card, Box, Typography, Button } from '@mui/material';
import { Globe, Plus } from 'lucide-react';

interface DomainEmptyStateProps {
  onConnect: () => void;
}

export const DomainEmptyState: React.FC<DomainEmptyStateProps> = ({ onConnect }) => {
  return (
    <Card sx={{ p: 4, textAlign: 'center', border: '1px solid #E4E9DC', borderRadius: 1.25, boxShadow: 'none' }}>
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: 'rgba(88, 117, 41, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
        }}
      >
        <Globe size={28} color="#587529" />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1C2411' }}>
        No branded domains connected yet
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 480, mx: 'auto', mb: 3, lineHeight: 1.6 }}>
        Connect your domain, configure the DNS CNAME record, and start publishing verified branded short links today.
      </Typography>
      <Button
        variant="contained"
        disableElevation
        disableRipple
        startIcon={<Plus size={16} />}
        onClick={onConnect}
        sx={{ textTransform: 'none', fontWeight: 700 }}
      >
        Connect your first domain
      </Button>
    </Card>
  );
};
