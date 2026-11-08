import React from 'react';
import { Card, Box, Typography, Button } from '@mui/material';
import { Sparkles } from 'lucide-react';

interface DomainUpgradeBannerProps {
  onUpgrade: () => void;
}

export const DomainUpgradeBanner: React.FC<DomainUpgradeBannerProps> = ({ onUpgrade }) => {
  return (
    <Card
      sx={{
        mb: 4,
        p: 3,
        bgcolor: 'rgba(237, 218, 94, 0.25)',
        border: '1px solid #EDDA5E',
        borderRadius: 1.25,
        boxShadow: 'none',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ maxWidth: 650 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Sparkles size={18} color="#71951E" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#587529' }}>
              Upgrade to Pro to unlock custom branded domains
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#1C2411', lineHeight: 1.6 }}>
            Build customer trust and boost click-through rates by up to 34% with branded domains like <strong>link.yourbrand.in/promo</strong> instead of generic shorteners. Pro includes 1 domain, while Agency includes 5 domains.
          </Typography>
        </Box>
        <Button
          variant="contained"
          disableElevation
          disableRipple
          onClick={onUpgrade}
          sx={{
            bgcolor: '#1C2411',
            color: '#ffffff',
            textTransform: 'none',
            fontWeight: 700,
            px: 2.5,
            '&:hover': { bgcolor: '#000000' },
          }}
        >
          View Pro & Agency plans
        </Button>
      </Box>
    </Card>
  );
};
