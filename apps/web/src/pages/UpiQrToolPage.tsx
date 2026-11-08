import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Download,
  ChevronDown,
  CreditCard,
  Store,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QrStudio } from '../components/qr/QrStudio';
import { LegalModal } from '../components/landing/LegalModal';

export const UpiQrToolPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

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
              UPI QR Maker
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
              onClick={() => navigate(isAuthenticated ? '/dashboard/qr' : '/register')}
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
              {isAuthenticated ? 'Open QR studio' : 'Sign up free'}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box component="section" sx={{ pt: { xs: 8, md: 10 }, pb: { xs: 8, md: 8 }, bgcolor: '#FBFBFA', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: { xs: 1.5, sm: 2 },
              py: 0.6,
              borderRadius: '999px',
              bgcolor: 'rgba(88, 117, 41, 0.1)',
              border: '1px solid rgba(88, 117, 41, 0.25)',
              mb: 3,
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          >
            <Store size={15} color="#587529" style={{ flexShrink: 0 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#587529', textWrap: 'balance' }}>
              Free branded UPI payment QR code generator with logo
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
              fontSize: { xs: '1.85rem', sm: '2.75rem', md: '3.5rem' },
              lineHeight: 1.15,
              color: '#1C2411',
              textWrap: 'balance',
            }}
          >
            Create branded UPI payment QR codes with your business logo
          </Typography>

          <Typography
            variant="body1"
            sx={{
              maxWidth: 640,
              mx: 'auto',
              mb: 5,
              color: '#556345',
              fontSize: { xs: '1rem', md: '1.125rem' },
              lineHeight: 1.6,
              textWrap: 'pretty',
            }}
          >
            Accept seamless payments via PhonePe, Google Pay, Paytm, and BHIM. Embed your store logo, customize QR colors, and download print ready vector cards for cash counters and product packaging.
          </Typography>

          {/* Embedded Interactive QR Studio */}
          <Box sx={{ maxWidth: 840, mx: 'auto', textAlign: 'left', width: '100%', overflowX: 'hidden' }}>
            <QrStudio />
          </Box>
        </Container>
      </Box>

      {/* UPI Features Grid */}
      <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: '#ffffff', borderTop: '1px solid #E4E9DC' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#71951E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Merchant Features
            </Typography>
            <Typography variant="h3" component="h2" sx={{ fontWeight: 600, mt: 1, color: '#1C2411' }}>
              Built for retail shops, restaurants and service providers
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3.5, height: '100%', borderRadius: 3, border: '1px solid #E4E9DC' }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(88, 117, 41, 0.1)', color: '#587529', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <Store size={24} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Store Logo Centerpiece
                </Typography>
                <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
                  Replace generic bank QR codes with your official store logo. Customers scan with confidence when payment prompts display your verified brand identity.
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3.5, height: '100%', borderRadius: 3, border: '1px solid #E4E9DC' }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(113, 149, 30, 0.12)', color: '#587529', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <CreditCard size={24} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Universal UPI App Support
                </Typography>
                <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
                  Compatible with all standard National Payments Corporation of India (NPCI) UPI protocols, including Google Pay, PhonePe, Paytm, BHIM, and bank mobile apps.
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3.5, height: '100%', borderRadius: 3, border: '1px solid #E4E9DC' }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(244, 190, 56, 0.2)', color: '#587529', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <Download size={24} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Print Ready Vector Downloads
                </Typography>
                <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
                  Export high resolution SVG and 1024px PNG files formatted for acrylic cash counter stands, vinyl decals, and physical invoices.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* UPI FAQ Section */}
      <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: '#FBFBFA', borderTop: '1px solid #E4E9DC' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#71951E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              UPI Payments FAQ
            </Typography>
            <Typography variant="h3" component="h2" sx={{ fontWeight: 600, mt: 1, color: '#1C2411' }}>
              Frequently asked questions on branded UPI QR codes
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Accordion elevation={0} sx={{ border: '1px solid #E4E9DC', borderRadius: '12px !important', bgcolor: '#ffffff', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ChevronDown size={18} color="#587529" />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Does URLRef take any commission or fee on UPI payments?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
                  No. Payments transfer directly from the customer bank account to your verified UPI VPA address through standard NPCI banking rails with zero platform fees or transaction deductions.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} sx={{ border: '1px solid #E4E9DC', borderRadius: '12px !important', bgcolor: '#ffffff', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ChevronDown size={18} color="#587529" />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Can I preset a fixed payment amount in the QR code?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
                  Yes. You can leave the amount empty for customer defined amounts at cash counters, or specify an exact amount for fixed price products, event passes, or dining bills.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ py: 4, bgcolor: '#111709', color: '#556345', borderTop: '1px solid #233014' }}>
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
            URLRef UPI QR Maker
          </Typography>
          <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 3 }, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box component="a" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} sx={{ color: '#EDDA5E', textDecoration: 'none', cursor: 'pointer' }}>
              Home
            </Box>
            <Box component="a" href="/solutions/agencies" onClick={(e) => { e.preventDefault(); navigate('/solutions/agencies'); }} sx={{ color: '#EDDA5E', textDecoration: 'none', cursor: 'pointer' }}>
              For Agencies
            </Box>
            <Box component="a" href="/solutions/bulk-dynamic-qr" onClick={(e) => { e.preventDefault(); navigate('/solutions/bulk-dynamic-qr'); }} sx={{ color: '#EDDA5E', textDecoration: 'none', cursor: 'pointer' }}>
              Dynamic QR
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

      <LegalModal open={Boolean(legalModal)} type={legalModal} onClose={() => setLegalModal(null)} />
    </Box>
  );
};
