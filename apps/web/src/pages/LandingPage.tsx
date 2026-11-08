import React, { useState, useEffect } from 'react';
import { Box, IconButton } from '@mui/material';
import { ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QrCodeModal } from '../components/links/QrCodeModal';
import { LeadCaptureModal } from '../components/leads/LeadCaptureModal';
import { TaglineReveal } from '../components/landing/TaglineReveal';
import { BillingModal } from '../components/billing/BillingModal';
import { LegalModal } from '../components/landing/LegalModal';
import { LandingHeader } from '../components/landing/LandingHeader';
import { LandingHeroSection } from '../components/landing/LandingHeroSection';
import { LandingComparisonSection } from '../components/landing/LandingComparisonSection';
import { LandingPricingSection } from '../components/landing/LandingPricingSection';
import { LandingFeaturesSection } from '../components/landing/LandingFeaturesSection';
import { MarketingFaqSection, MarketingBottomCta } from '../components/landing/MarketingSection';
import { LandingFooter } from '../components/landing/LandingFooter';
import { LandingSolutionsBar } from '../components/landing/LandingSolutionsBar';
import { LandingWelcomeBanner } from '../components/landing/LandingWelcomeBanner';
import { useLandingShortener } from '../hooks/useLandingShortener';

const HOMEPAGE_FAQS = [
  {
    q: 'What is a dynamic QR code?',
    a: 'A dynamic QR code encodes a short redirect link. If you print packaging or flyers and later need to change where the link points, you can edit the destination in your dashboard without reprinting.',
  },
  {
    q: 'How do custom domains work?',
    a: 'You point a CNAME DNS record to our edge target. Cloudflare for SaaS automatically issues an SSL certificate, and your short links run under your own domain name.',
  },
  {
    q: 'Which payment methods are accepted in India?',
    a: 'We accept Indian credit and debit cards, NetBanking, and UPI AutoPay recurring mandates for hassle-free monthly and annual renewals.',
  },
  {
    q: 'Can I create short links and dynamic QR codes in bulk?',
    a: 'Yes. High volume campaigns are fully supported with our fast Base62 generation engine and up to 1,000 monthly links on the Growth tier.',
  },
  {
    q: 'What happens when my 10 free links for the month are used?',
    a: 'Your existing links and printed dynamic QR codes continue working forever without interruption. You can upgrade to Pro for ₹199 per month to unlock 100 links per month.',
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [heroMode, setHeroMode] = useState<'shortener' | 'qr'>('shortener');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadModalConfig, setLeadModalConfig] = useState<{ title?: string; subtitle?: string }>({
    title: 'Need more QR codes and short links?',
    subtitle: 'Sign up for free now and unlock 10 links each month with dynamic editable QR codes and analytics.',
  });

  const triggerLeadModal = (title?: string, subtitle?: string) => {
    setLeadModalConfig({
      title: title || 'Need more QR codes and short links?',
      subtitle: subtitle || 'Sign up for free now and unlock 10 links each month with dynamic editable QR codes and analytics.',
    });
    setLeadModalOpen(true);
  };

  const {
    destinationUrl,
    setDestinationUrl,
    loading,
    error,
    createdLink,
    setCreatedLink,
    copied,
    hasReachedGuestLimit,
    setHasReachedGuestLimit,
    handleShorten,
    handleCopy,
    handleShare,
    handleShortenAnother,
  } = useLandingShortener({
    isAuthenticated,
    onOpenLeadModal: triggerLeadModal,
  });

  useEffect(() => {
    document.title = 'URLRef — Shorten, Brand & Track Links with Dynamic QR Codes';
  }, []);

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleModeChange = (newMode: 'shortener' | 'qr') => {
    setHeroMode(newMode);
    if (window.scrollY > 80) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#FBFBFA', display: 'flex', flexDirection: 'column' }}>
      {/* Floating Translucent Navigation Bar */}
      <LandingHeader heroMode={heroMode} onModeChange={handleModeChange} />

      {/* Logged-in Welcome Banner */}
      {isAuthenticated && user && <LandingWelcomeBanner email={user.email} />}

      {/* Hero Section */}
      <LandingHeroSection
        heroMode={heroMode}
        onModeChange={handleModeChange}
        destinationUrl={destinationUrl}
        setDestinationUrl={setDestinationUrl}
        loading={loading}
        error={error}
        createdLink={createdLink}
        copied={copied}
        hasReachedGuestLimit={hasReachedGuestLimit}
        isAuthenticated={isAuthenticated}
        isDetailsOpen={isDetailsOpen}
        setIsDetailsOpen={setIsDetailsOpen}
        onShorten={handleShorten}
        onCopy={handleCopy}
        onShare={handleShare}
        onOpenQrModal={() => setQrModalOpen(true)}
        onTriggerLeadModal={triggerLeadModal}
        onShortenAnother={handleShortenAnother}
        onDynamicLinkCreated={(link) => {
          setCreatedLink(link);
          setHasReachedGuestLimit(true);
        }}
      />

      {/* Audience Solution Shortcuts */}
      <LandingSolutionsBar />

      {/* Mandatory Tagline Reveal Section */}
      <TaglineReveal phrase="Every link you share represents your brand. Transform long cluttered URLs into fast branded short links and high converting dynamic QR codes." />

      {/* Features & Solutions Section */}
      <LandingFeaturesSection onNavigate={navigate} />

      {/* Head-to-Head Comparison Matrix */}
      <LandingComparisonSection />

      {/* Pricing Matrix Section */}
      <LandingPricingSection
        isAuthenticated={isAuthenticated}
        onUpgradePro={() => {
          if (isAuthenticated) {
            setBillingModalOpen(true);
          } else {
            navigate('/register');
          }
        }}
        onUpgradeAgency={() => {
          if (isAuthenticated) {
            setBillingModalOpen(true);
          } else {
            navigate('/register');
          }
        }}
        onGetStartedFree={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
      />

      {/* Frequently Asked Questions */}
      <MarketingFaqSection
        caption="FAQ"
        title="Frequently asked questions"
        faqs={HOMEPAGE_FAQS}
      />

      {/* Final Matching CTA */}
      <MarketingBottomCta
        title="Start shortening links and creating branded QRs"
        subtitle="Join creators and merchants who use URLRef for fast redirects, custom domains, and dynamic QR tracking."
        buttonText={isAuthenticated ? 'Open dashboard' : 'Create free account'}
        onAction={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
      />

      {/* Semantic Footer with Legal Links */}
      <LandingFooter onOpenLegalModal={(type) => setLegalModal(type)} />

      {/* Floating [Up Arrow] Scroll-To-Top Button */}
      {showScrollTop && (
        <IconButton
          onClick={handleScrollToTop}
          aria-label="Scroll to top"
          disableRipple
          sx={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            zIndex: 1200,
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: '#587529',
            color: '#ffffff',
            boxShadow: '0 4px 16px rgba(88, 117, 41, 0.4)',
            border: '1.5px solid #71951E',
            transition: 'all 250ms cubic-bezier(0.22, 1, 0.36, 1)',
            '&:hover': {
              bgcolor: '#71951E',
              transform: 'translateY(-2px)',
            },
          }}
        >
          <ArrowUp size={22} />
        </IconButton>
      )}

      {/* Modals */}
      <QrCodeModal open={qrModalOpen} link={createdLink} onClose={() => setQrModalOpen(false)} />
      <LeadCaptureModal
        open={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        title={leadModalConfig.title}
        subtitle={leadModalConfig.subtitle}
      />
      <BillingModal open={billingModalOpen} onClose={() => setBillingModalOpen(false)} />
      <LegalModal open={Boolean(legalModal)} type={legalModal} onClose={() => setLegalModal(null)} />
    </Box>
  );
};
