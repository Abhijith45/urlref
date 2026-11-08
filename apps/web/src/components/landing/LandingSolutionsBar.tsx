import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const SOLUTIONS = [
  { label: 'Digital Agencies (5 Domains)', path: '/solutions/agencies' },
  { label: 'Print & Packaging QRs', path: '/solutions/bulk-dynamic-qr' },
  { label: 'Branded UPI Payment QRs', path: '/tools/upi-qr-generator' },
];

export const LandingSolutionsBar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ py: 2.5, bgcolor: '#ffffff', borderBottom: '1px solid #E4E9DC' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: { xs: 1, sm: 2 } }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#587529', mr: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Solutions for:
          </Typography>
          {SOLUTIONS.map((sol) => (
            <Button
              key={sol.path}
              size="small"
              variant="outlined"
              onClick={() => navigate(sol.path)}
              sx={{
                borderColor: '#E4E9DC',
                color: '#1C2411',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                fontSize: '0.85rem',
                '&:hover': { borderColor: '#587529', bgcolor: '#F4F7EE' },
              }}
            >
              {sol.label}
            </Button>
          ))}
        </Box>
      </Container>
    </Box>
  );
};
