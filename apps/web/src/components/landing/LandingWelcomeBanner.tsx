import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LandingWelcomeBannerProps {
  email: string;
}

export const LandingWelcomeBanner: React.FC<LandingWelcomeBannerProps> = ({ email }) => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ mt: 3 }}>
      <Box
        sx={{
          p: 2,
          bgcolor: '#ffffff',
          borderRadius: 3,
          border: '1px solid #E4E9DC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Typography variant="body2" sx={{ color: '#1C2411' }}>
          Logged in as <strong>{email}</strong>. Monthly quota ready.
        </Typography>
        <Button
          size="small"
          variant="outlined"
          color="primary"
          disableElevation
          disableRipple
          onClick={() => navigate('/dashboard')}
          endIcon={<ArrowRight size={14} />}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Open dashboard
        </Button>
      </Box>
    </Container>
  );
};
