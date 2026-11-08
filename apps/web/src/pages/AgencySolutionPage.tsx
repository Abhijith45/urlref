import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
} from '@mui/material';
import {
  Globe,
  BarChart3,
  ArrowRight,
  Layers,
  Building2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BillingModal } from '../components/billing/BillingModal';
import { LegalModal } from '../components/landing/LegalModal';
import {
  MarketingFeatureGrid,
  MarketingFaqAccordion,
  MarketingBottomCta,
} from '../components/landing/MarketingSection';

const AGENCY_STATS = [
  { value: '5 Domains', label: 'Included on Growth plan' },
  { value: 'Sub 20ms', label: 'Fast Base62 redirection' },
  { value: '365 Days', label: 'Full analytics retention' },
];

const AGENCY_FEATURES = [
  {
    icon: <Globe size={24} />,
    title: '5 Branded Client Domains',
    desc: 'Configure custom CNAME records for up to 5 clients (like links.clientname.com). Automated edge SSL provisioning guarantees zero security warnings.',
    bg: 'rgba(88, 117, 41, 0.1)',
  },
  {
    icon: <Layers size={24} />,
    title: '1,000 Links per Month',
    desc: 'Distribute campaign links across multiple clients and channels. High speed Base62 generation prevents collisions and supports custom back half aliases.',
    bg: 'rgba(113, 149, 30, 0.12)',
  },
  {
    icon: <BarChart3 size={24} />,
    title: 'Client Ready Analytics',
    desc: 'Provide clear insights on click volume, geographic regions, devices, and referring social platforms without storing intrusive user IP addresses.',
    bg: 'rgba(244, 190, 56, 0.2)',
  },
];

const AGENCY_FAQS = [
  {
    q: 'Can I use different custom domains for different client accounts?',
    a: 'Yes. On the Growth plan, you can connect up to 5 completely separate custom domains. When creating a short link, select which client domain should power that specific URL.',
  },
  {
    q: 'How does SSL certificate generation work for client domains?',
    a: 'Your client points a CNAME record to our verification target. Our edge infrastructure automatically handles SSL certificate issuance and renewals via Cloudflare for SaaS.',
  },
  {
    q: 'How does pricing compare to Bitly Enterprise?',
    a: 'Bitly charges 199 dollars to 350 dollars per month for custom domains. URLRef delivers 5 custom domains and 1,000 links per month for only 499 rupees per month with UPI AutoPay or credit card.',
  },
];

const SectionHeading: React.FC<{ eyebrow: string; title: string; mb?: number }> = ({ eyebrow, title, mb = 6 }) => (
  <Box sx={{ textAlign: 'center', mb }}>
    <Typography variant="caption" sx={{ fontWeight: 700, color: '#71951E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
      {eyebrow}
    </Typography>
    <Typography variant="h3" component="h2" sx={{ fontWeight: 600, mt: 1, color: '#1C2411' }}>
      {title}
    </Typography>
  </Box>
);

export const AgencySolutionPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    document.title = 'Custom Domain Shortener for Marketing Agencies — URLRef';
  }, []);

  const handleAction = () => {
    if (isAuthenticated) {
      setBillingModalOpen(true);
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
                flexShrink: 0,
              }}
            >
              U
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: '#1C2411' }}>
              URLRef
            </Typography>
            <Typography variant="caption" sx={{ color: '#587529', fontWeight: 600, ml: 0.5, display: { xs: 'none', sm: 'inline' } }}>
              For Agencies
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
              Get started
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
              bgcolor: 'rgba(88, 117, 41, 0.1)',
              border: '1px solid rgba(88, 117, 41, 0.25)',
              mb: 3,
            }}
          >
            <Building2 size={15} color="#587529" />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#587529' }}>
              Built for digital marketing agencies & growth consultancies
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
            Manage multiple client branded links without Bitly markups
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
            Connect up to 5 custom domains on our Growth plan for ₹499 per month. Deploy client vanity URLs with automatic SSL, sub second redirection, and privacy first campaign analytics.
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
              Start Agency Plan for ₹499/mo
            </Button>
            <Button
              variant="outlined"
              size="large"
              disableElevation
              disableRipple
              onClick={() => navigate('/register')}
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
              Test free tier first
            </Button>
          </Box>

          {/* Social Proof Stats */}
          <Grid container spacing={2} sx={{ maxWidth: 700, mx: 'auto' }}>
            {AGENCY_STATS.map((stat) => (
              <Grid item xs={12} sm={4} key={stat.value}>
                <Box sx={{ p: 2, border: '1px solid #E4E9DC', borderRadius: 2, bgcolor: '#ffffff' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#587529' }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#556345' }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Core Agency Benefits */}
      <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: '#ffffff', borderTop: '1px solid #E4E9DC' }}>
        <Container maxWidth="lg">
          <SectionHeading
            eyebrow="Why agencies choose URLRef"
            title="Everything your agency needs to deliver client results"
            mb={8}
          />

          <MarketingFeatureGrid items={AGENCY_FEATURES} />
        </Container>
      </Box>

      {/* Agency FAQ Section */}
      <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: '#FBFBFA', borderTop: '1px solid #E4E9DC' }}>
        <Container maxWidth="md">
          <SectionHeading
            eyebrow="Agency FAQ"
            title="Frequently asked questions by marketing agencies"
          />

          <MarketingFaqAccordion faqs={AGENCY_FAQS} />
        </Container>
      </Box>

      {/* Bottom CTA */}
      <MarketingBottomCta
        title="Elevate your agency marketing campaigns today"
        subtitle="Get started with 5 custom client domains and 1,000 monthly links for only ₹499 per month."
        buttonText={isAuthenticated ? 'Open billing portal' : 'Start agency subscription'}
        onAction={handleAction}
      />

      {/* Footer */}
      <Box component="footer" sx={{ py: 4, bgcolor: '#111709', color: '#556345', borderTop: '1px solid #233014' }}>
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
            URLRef for Agencies
          </Typography>
          <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 3 }, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box component="a" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} sx={{ color: '#EDDA5E', textDecoration: 'none', cursor: 'pointer' }}>
              Home
            </Box>
            <Box component="a" href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }} sx={{ color: '#EDDA5E', textDecoration: 'none', cursor: 'pointer' }}>
              Sign up
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
