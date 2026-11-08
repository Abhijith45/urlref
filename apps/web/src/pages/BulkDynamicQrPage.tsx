import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
} from '@mui/material';
import {
  ArrowRight,
  Printer,
  Sparkles,
  Shuffle,
  Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BillingModal } from '../components/billing/BillingModal';
import { LegalModal } from '../components/landing/LegalModal';
import {
  MarketingFeatureGrid,
  MarketingFaqSection,
  MarketingBottomCta,
} from '../components/landing/MarketingSection';

const QR_ADVANTAGES = [
  {
    icon: <Shuffle size={24} />,
    title: 'Update Anytime Without Reprinting',
    desc: 'If your seasonal promotion finishes or a product destination URL updates, modify the redirect destination in your dashboard without touching your printed packaging.',
    bg: 'rgba(88, 117, 41, 0.1)',
  },
  {
    icon: <Download size={24} />,
    title: 'Vector SVG & 1024px PNG Downloads',
    desc: 'Export high resolution assets formatted specifically for professional printers, designers, and packaging dies with crisp edges at any physical scale.',
    bg: 'rgba(113, 149, 30, 0.12)',
  },
  {
    icon: <Sparkles size={24} />,
    title: 'Custom Logo Centerpiece',
    desc: 'Embed your company or product logo at the center of the QR code. Automatic Level H error correction protects scannability even when 30 percent of the matrix is obscured.',
    bg: 'rgba(244, 190, 56, 0.2)',
  },
];

const QR_FAQS = [
  {
    q: 'Will a dynamic QR code ever expire?',
    a: 'No. Links created in URLRef remain active indefinitely. Even on our free community tier, your dynamic links continue routing visitors to your destination URL without expiring.',
  },
  {
    q: 'What happens when I change the destination URL in the dashboard?',
    a: 'The change takes effect immediately. Our in-memory cache and edge database update instantly, so the next person scanning your printed QR code arrives at the new destination URL.',
  },
  {
    q: 'Which file format should I send to my print shop?',
    a: 'We recommend providing the vector SVG download. SVG files scale to billboard dimensions without raster pixelation or loss of print sharpness.',
  },
];

export const BulkDynamicQrPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    document.title = 'Dynamic QR Codes for Packaging & Print Collateral — URLRef';
  }, []);

  const handleAction = () => {
    if (isAuthenticated) {
      navigate('/dashboard/qr');
    } else {
      navigate('/register');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#ffffff', color: '#1C2411', overflowX: 'hidden' }}>
      {/* Top Floating Navigation */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          backdropFilter: 'blur(12px)',
          bgcolor: 'rgba(255, 255, 255, 0.92)',
          borderBottom: '1px solid #E4E9DC',
          py: 1.5,
        }}
      >
        <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box
            component="a"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'inherit' }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                bgcolor: '#587529',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
              }}
            >
              U
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              URLRef
            </Typography>
            <Typography variant="caption" sx={{ color: '#587529', fontWeight: 600, ml: 0.5, display: { xs: 'none', sm: 'inline' } }}>
              Dynamic QR for Packaging
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            <Button
              variant="text"
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
              sx={{ color: '#1C2411', fontWeight: 600, textTransform: 'none', display: { xs: 'none', sm: 'inline-flex' } }}
            >
              {isAuthenticated ? 'Dashboard' : 'Sign in'}
            </Button>
            <Button
              variant="contained"
              disableElevation
              disableRipple
              onClick={handleAction}
              sx={{
                bgcolor: '#1C2411',
                color: '#ffffff',
                fontWeight: 700,
                textTransform: 'none',
                px: { xs: 1.8, sm: 2.5 },
                py: 0.8,
                borderRadius: 2,
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#000000' },
              }}
            >
              Create dynamic QR
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box component="section" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 10 }, bgcolor: '#FBFBFA', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.6,
              borderRadius: '999px',
              bgcolor: 'rgba(113, 149, 30, 0.1)',
              border: '1px solid rgba(113, 149, 30, 0.25)',
              mb: 3,
            }}
          >
            <Printer size={15} color="#587529" />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#587529' }}>
              Engineered for packaging, product labels, table tents & print flyers
            </Typography>
          </Box>

          <Typography
            variant="h1"
            component="h1"
            sx={{
              maxWidth: 720,
              mx: 'auto',
              mb: 3,
              fontWeight: 700,
              fontSize: { xs: '2.25rem', sm: '3rem', md: '3.75rem' },
              lineHeight: 1.1,
              color: '#1C2411',
              textWrap: 'balance',
            }}
          >
            Dynamic QR codes that eliminate physical reprinting costs
          </Typography>

          <Typography
            variant="body1"
            sx={{
              maxWidth: 640,
              mx: 'auto',
              mb: 4,
              color: '#556345',
              fontSize: { xs: '1rem', md: '1.125rem' },
              lineHeight: 1.6,
              textWrap: 'pretty',
            }}
          >
            Change where your QR code redirects anytime from your dashboard. Download high resolution vector SVG files ready for commercial CMYK print shops. Never scrap printed collateral again.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mb: 5 }}>
            <Button
              variant="contained"
              size="large"
              disableElevation
              disableRipple
              onClick={handleAction}
              endIcon={<ArrowRight size={18} />}
              sx={{
                bgcolor: '#587529',
                color: '#ffffff',
                fontWeight: 700,
                px: 3.5,
                py: 1.25,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': { bgcolor: '#465f20' },
              }}
            >
              Generate your first dynamic QR
            </Button>
            <Button
              variant="outlined"
              size="large"
              disableElevation
              disableRipple
              onClick={() => navigate('/')}
              sx={{
                borderColor: '#E4E9DC',
                color: '#1C2411',
                fontWeight: 600,
                px: 3,
                py: 1.25,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': { borderColor: '#587529', bgcolor: '#ffffff' },
              }}
            >
              Preview interactive studio
            </Button>
          </Box>

          {/* Social Proof Stats */}
          <Grid container spacing={2} sx={{ maxWidth: 700, mx: 'auto' }}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 2, border: '1px solid #E4E9DC', borderRadius: 2, bgcolor: '#ffffff' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#587529' }}>
                  Zero
                </Typography>
                <Typography variant="caption" sx={{ color: '#556345' }}>
                  Reprinting expenses
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 2, border: '1px solid #E4E9DC', borderRadius: 2, bgcolor: '#ffffff' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#587529' }}>
                  Lossless SVG
                </Typography>
                <Typography variant="caption" sx={{ color: '#556345' }}>
                  Vector print exports
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 2, border: '1px solid #E4E9DC', borderRadius: 2, bgcolor: '#ffffff' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#587529' }}>
                  30 Percent
                </Typography>
                <Typography variant="caption" sx={{ color: '#556345' }}>
                  Error recovery with logo
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: '#ffffff', borderTop: '1px solid #E4E9DC' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#71951E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Key Advantages
            </Typography>
            <Typography variant="h3" component="h2" sx={{ fontWeight: 600, mt: 1, color: '#1C2411' }}>
              Why brands prefer dynamic over static QR codes
            </Typography>
          </Box>

          <MarketingFeatureGrid items={QR_ADVANTAGES} />
        </Container>
      </Box>

      {/* Dynamic QR FAQ Section */}
      <MarketingFaqSection
        caption="Packaging FAQ"
        title="Frequently asked questions on dynamic QR codes"
        faqs={QR_FAQS}
      />

      {/* Bottom CTA */}
      <MarketingBottomCta
        title="Protect your print investments with dynamic QR codes"
        subtitle="Get started for free. Create dynamic QR codes and download print ready vector SVGs in seconds."
        buttonText={isAuthenticated ? 'Open QR studio' : 'Create free dynamic QR'}
        onAction={handleAction}
      />

      {/* Footer */}
      <Box component="footer" sx={{ py: 4, bgcolor: '#111709', color: '#556345', borderTop: '1px solid #233014' }}>
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
            URLRef Dynamic QR
          </Typography>
          <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 3 }, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box component="a" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} sx={{ color: '#EDDA5E', textDecoration: 'none', cursor: 'pointer' }}>
              Home
            </Box>
            <Box component="a" href="/solutions/agencies" onClick={(e) => { e.preventDefault(); navigate('/solutions/agencies'); }} sx={{ color: '#EDDA5E', textDecoration: 'none', cursor: 'pointer' }}>
              For Agencies
            </Box>
            <Box component="button" onClick={() => setLegalModal('privacy')} sx={{ background: 'none', border: 'none', p: 0, color: '#556345', cursor: 'pointer' }}>
              Privacy policy
            </Box>
            <Box component="button" onClick={() => setLegalModal('terms')} sx={{ background: 'none', border: 'none', p: 0, color: '#556345', cursor: 'pointer' }}>
              Terms of service
            </Box>
          </Box>
        </Container>
      </Box>

      <BillingModal open={billingModalOpen} onClose={() => setBillingModalOpen(false)} />
      <LegalModal open={Boolean(legalModal)} type={legalModal} onClose={() => setLegalModal(null)} />
    </Box>
  );
};
