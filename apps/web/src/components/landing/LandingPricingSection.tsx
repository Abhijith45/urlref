import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  Chip,
  Button,
} from '@mui/material';
import { Check } from 'lucide-react';

interface LandingPricingSectionProps {
  isAuthenticated: boolean;
  onUpgradePro: () => void;
  onUpgradeAgency: () => void;
  onGetStartedFree: () => void;
}

export const LandingPricingSection: React.FC<LandingPricingSectionProps> = ({
  isAuthenticated,
  onUpgradePro,
  onUpgradeAgency,
  onGetStartedFree,
}) => {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#ffffff', borderTop: '1px solid #E4E9DC' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#71951E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Pricing
          </Typography>
          <Typography variant="h3" component="h2" sx={{ fontWeight: 600, mt: 1, color: '#1C2411' }}>
            Simple pricing with UPI AutoPay
          </Typography>
          <Typography variant="body1" sx={{ color: '#556345', mt: 1 }}>
            Choose a monthly plan or save 17 percent with annual upfront billing.
          </Typography>
        </Box>

        <Grid container spacing={3} alignItems="stretch">
          {/* Free Tier */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3.5, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#ffffff', border: '1px solid #E4E9DC' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Free Community
              </Typography>
              <Typography variant="body2" sx={{ color: '#556345', mb: 2 }}>
                For testing and personal links
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600, mb: 3 }}>
                ₹0 <Typography component="span" variant="body2" sx={{ color: '#556345' }}>/ month</Typography>
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2">10 links per month</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2">Standard black and white QR codes</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2">Default domain (urlref.softics.in)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2">7 day aggregate click analytics</Typography>
                </Box>
              </Box>

              <Button
                variant="outlined"
                color="primary"
                fullWidth
                disableElevation
                disableRipple
                onClick={onGetStartedFree}
                sx={{ fontWeight: 700, py: 1.1, borderRadius: 2, textTransform: 'none' }}
              >
                {isAuthenticated ? 'Open dashboard' : 'Get started free'}
              </Button>
            </Card>
          </Grid>

          {/* Pro Tier (Featured in Gold/Olive) */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                p: 3.5,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#ffffff',
                border: '2px solid #587529',
                position: 'relative',
                boxShadow: '0 8px 30px rgba(88, 117, 41, 0.12)',
              }}
            >
              <Chip
                label="POPULAR"
                size="small"
                sx={{
                  position: 'absolute',
                  top: 6,
                  right: 8,
                  bgcolor: '#F4BE38',
                  color: '#1C2411',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Pro Creator
              </Typography>
              <Typography variant="body2" sx={{ color: '#556345', mb: 2 }}>
                For D2C brands, creators and small shops
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h3" sx={{ fontWeight: 600, color: '#587529' }}>
                  ₹199 <Typography component="span" variant="body2" sx={{ color: '#556345' }}>/ month</Typography>
                </Typography>
                <Typography variant="caption" sx={{ color: '#71951E', fontWeight: 700 }}>
                  Or ₹1,999 per year upfront (Save 17 percent)
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Check size={16} color="#587529" />
                  <Typography variant="body2"><strong>100 links</strong> per month</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Check size={16} color="#587529" />
                  <Typography variant="body2"><strong>1 Custom domain</strong> (e.g. go.brand.in)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Check size={16} color="#587529" />
                  <Typography variant="body2"><strong>Dynamic QR codes</strong> (update destination post print)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Check size={16} color="#587529" />
                  <Typography variant="body2">Branded QR Studio with center logo</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Check size={16} color="#587529" />
                  <Typography variant="body2">WhatsApp and UPI payment QR intents</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Check size={16} color="#587529" />
                  <Typography variant="body2">30 day click analytics and referrers</Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                fullWidth
                disableElevation
                disableRipple
                onClick={onUpgradePro}
                sx={{
                  fontWeight: 700,
                  py: 1.1,
                  borderRadius: 2,
                  textTransform: 'none',
                  bgcolor: '#1C2411',
                  color: '#ffffff',
                  '&:hover': { bgcolor: '#000000' },
                }}
              >
                Upgrade to Pro
              </Button>
            </Card>
          </Grid>

          {/* Growth Tier */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3.5, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#ffffff', border: '1px solid #E4E9DC' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Agency Growth
              </Typography>
              <Typography variant="body2" sx={{ color: '#556345', mb: 2 }}>
                For digital marketing agencies
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h3" sx={{ fontWeight: 600 }}>
                  ₹499 <Typography component="span" variant="body2" sx={{ color: '#556345' }}>/ month</Typography>
                </Typography>
                <Typography variant="caption" sx={{ color: '#556345' }}>
                  Or ₹4,999 per year upfront
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2"><strong>1,000 links</strong> per month</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2"><strong>5 Custom branded domains</strong></Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2">Unlimited dynamic QR codes</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2">Vector SVG and print exports</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Check size={16} color="#71951E" />
                  <Typography variant="body2">Custom 404 destination</Typography>
                </Box>
              </Box>

              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                disableElevation
                disableRipple
                onClick={onUpgradeAgency}
                sx={{
                  fontWeight: 700,
                  py: 1.1,
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: '#1C2411',
                  color: '#1C2411',
                  '&:hover': { bgcolor: '#F4F7EE' },
                }}
              >
                Upgrade to Agency
              </Button>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
