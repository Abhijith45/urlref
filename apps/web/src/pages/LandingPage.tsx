import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Avatar,
  ToggleButtonGroup,
  ToggleButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
} from '@mui/material';
import {
  Link2,
  Zap,
  QrCode,
  ShieldCheck,
  BarChart3,
  Copy,
  Check,
  ArrowRight,
  ArrowUp,
  ExternalLink,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
  Globe,
  Clock,
  Share2,
  Shuffle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api-client';
import { LinkDto } from '@shortener/shared';
import { QrCodeModal } from '../components/links/QrCodeModal';
import { QrStudio } from '../components/qr/QrStudio';
import { LeadCaptureModal } from '../components/leads/LeadCaptureModal';
import { TaglineReveal } from '../components/landing/TaglineReveal';
import { BillingModal } from '../components/billing/BillingModal';
import { LegalModal } from '../components/landing/LegalModal';

const GUEST_LINK_KEY = 'urlref_guest_link';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // Mode: 'shortener' | 'qr'
  const [heroMode, setHeroMode] = useState<'shortener' | 'qr'>('shortener');

  const [destinationUrl, setDestinationUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<LinkDto | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [hasReachedGuestLimit, setHasReachedGuestLimit] = useState(false);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
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

  // Scroll to top button visibility state
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Listen for scroll to toggle [Up arrow] button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if guest link exists in localStorage
  useEffect(() => {
    const savedGuestLink = localStorage.getItem(GUEST_LINK_KEY);
    if (savedGuestLink) {
      try {
        const parsed = JSON.parse(savedGuestLink) as LinkDto;
        setCreatedLink(parsed);
        setHasReachedGuestLimit(true);
      } catch {
        localStorage.removeItem(GUEST_LINK_KEY);
      }
    }
  }, []);

  // Handle Switcher change with intelligent scroll-to-hero behavior
  const handleModeChange = (newMode: 'shortener' | 'qr') => {
    setHeroMode(newMode);
    // If user has scrolled down past the hero section, smoothly scroll back to top
    if (window.scrollY > 80) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationUrl) return;

    // Check if guest limit reached
    if (!isAuthenticated && hasReachedGuestLimit) {
      setLeadModalOpen(true);
      return;
    }

    // Validate protocol
    if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
      setError('Please provide a valid web address starting with http or https');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ data: LinkDto }>('/api/v1/links/public', {
        destinationUrl: destinationUrl.trim(),
      });

      const newLink = response.data.data;
      setCreatedLink(newLink);
      setHasReachedGuestLimit(true);
      localStorage.setItem(GUEST_LINK_KEY, JSON.stringify(newLink));
      setDestinationUrl('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        if (err.message.includes('free anonymous limit') || err.message.includes('RATE_LIMITED')) {
          setHasReachedGuestLimit(true);
          setLeadModalOpen(true);
        }
      } else {
        setError('Failed to shorten link. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!createdLink) return;
    navigator.clipboard.writeText(createdLink.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!createdLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shortened link via URLRef',
          url: createdLink.shortUrl,
        });
      } catch {
        // User dismissed native share dialog
      }
    } else {
      handleCopy();
    }
  };

  const handleShortenAnother = () => {
    if (!isAuthenticated && hasReachedGuestLimit) {
      triggerLeadModal(
        'Ready to create more links?',
        'URLRef is the right solution for you. Sign up for free now and unlock 10 links each month with dynamic editable QR codes.',
      );
    } else {
      setCreatedLink(null);
      setDestinationUrl('');
      localStorage.removeItem(GUEST_LINK_KEY);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#FBFBFA', display: 'flex', flexDirection: 'column' }}>
      {/* Floating Translucent Navigation Bar */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 12,
          zIndex: 1100,
          px: { xs: 2, sm: 4 },
        }}
      >
        <Box
          sx={{
            maxWidth: 1120,
            mx: 'auto',
            height: 64,
            px: { xs: 2, sm: 3 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            border: '1px solid #E4E9DC',
            boxShadow: '0 4px 20px -2px rgba(88, 117, 41, 0.08)',
          }}
        >
          {/* Brand Logo */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: '#587529', // Deep Forest Olive
                color: '#ffffff',
              }}
            >
              <Link2 size={20} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: '#1C2411' }}>
                URLRef
              </Typography>
              <Chip
                label="Softics"
                size="small"
                sx={{
                  bgcolor: '#EDDA5E', // Warm Sunlight Gold
                  color: '#587529',
                  fontSize: '0.7rem',
                  height: 20,
                  fontWeight: 700,
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              />
            </Box>
          </Box>

          {/* Mode Switcher Tabs with Scroll Detection */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            <ToggleButtonGroup
              value={heroMode}
              exclusive
              onChange={(_, newMode) => {
                if (newMode) handleModeChange(newMode);
              }}
              size="small"
              sx={{
                bgcolor: '#F3F6EC',
                p: '3px',
                borderRadius: '10px',
                border: '1px solid #E4E9DC',
                '& .MuiToggleButton-root': {
                  border: 'none',
                  borderRadius: '7px !important',
                  px: 2,
                  py: 0.6,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  color: '#556345',
                  transition: 'all 200ms cubic-bezier(0.22, 1, 0.36, 1)',
                  '&.Mui-selected': {
                    bgcolor: '#ffffff',
                    color: '#587529',
                    boxShadow: '0 1px 4px rgba(88, 117, 41, 0.12)',
                  },
                },
              }}
            >
              <ToggleButton value="shortener">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Link2 size={15} />
                  <span>URL Shortener</span>
                </Box>
              </ToggleButton>
              <ToggleButton value="qr">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <QrCode size={15} />
                  <span>QR Studio</span>
                  {/* <Chip
                    label="PRO"
                    size="small"
                    sx={{
                      bgcolor: '#F4BE38',
                      color: '#1C2411',
                      fontSize: '0.65rem',
                      height: 18,
                      fontWeight: 700,
                    }}
                  /> */}
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* User Auth Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isAuthenticated && user ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  disableElevation
                  disableRipple
                  onClick={() => navigate('/dashboard')}
                  endIcon={<ArrowRight size={15} />}
                  sx={{ fontWeight: 600, px: 2, textTransform: 'none' }}
                >
                  Dashboard
                </Button>
                <IconButton onClick={() => navigate('/dashboard')} size="small" disableRipple sx={{ p: 0.5 }}>
                  <Avatar sx={{ bgcolor: '#587529', width: 32, height: 32, fontSize: '0.8rem' }}>
                    {user.email.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
                <Button
                  variant="text"
                  color="inherit"
                  size="small"
                  disableElevation
                  disableRipple
                  onClick={async () => {
                    await logout();
                  }}
                  sx={{ color: '#556345', display: { xs: 'none', sm: 'inline-flex' }, textTransform: 'none' }}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="text"
                  color="inherit"
                  size="small"
                  disableElevation
                  disableRipple
                  onClick={() => navigate('/login')}
                  sx={{ color: '#556345', fontWeight: 600, textTransform: 'none' }}
                >
                  Sign in
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  disableElevation
                  disableRipple
                  onClick={() => navigate('/register')}
                  sx={{ fontWeight: 700, px: 2, textTransform: 'none' }}
                >
                  Get started
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Option B: Logged-in Welcome Banner */}
      {isAuthenticated && user && (
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
              Logged in as <strong>{user.email}</strong>. Monthly quota ready.
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
      )}

      {/* Hero Section */}
      <Box
        component="section"
        sx={{
          pt: { xs: 5, md: 8 },
          pb: { xs: 8, md: 12 },
          bgcolor: '#FBFBFA',
        }}
      >
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          {/* Mobile Switcher */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 3 }}>
            <ToggleButtonGroup
              value={heroMode}
              exclusive
              onChange={(_, newMode) => {
                if (newMode) handleModeChange(newMode);
              }}
              size="small"
              sx={{ bgcolor: '#ffffff', p: 0.5, borderRadius: 2, border: '1px solid #E4E9DC' }}
            >
              <ToggleButton value="shortener" sx={{ textTransform: 'none', fontWeight: 600 }}>
                Shorten Link
              </ToggleButton>
              <ToggleButton value="qr" sx={{ textTransform: 'none', fontWeight: 600 }}>
                QR Studio
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Eyebrow Badge */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.75,
              bgcolor: 'rgba(237, 218, 94, 0.35)', // Soft Sunlight Gold Tint
              border: '1px solid #EDDA5E',
              borderRadius: 99,
              mb: 3,
            }}
          >
            <Sparkles size={14} color="#71951E" />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#587529' }}>
              High speed link management and dynamic QR platform
            </Typography>
          </Box>

          {/* Hero Heading: Subtle Warm Gradient */}
          <Typography
            variant="h1"
            component="h1"
            sx={{
              maxWidth: '680px !important',
              mx: 'auto',
              mb: 3,
              background: 'linear-gradient(to right, #1C2411 0%, #587529 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textWrap: 'balance',
            }}
          >
            {heroMode === 'shortener'
              ? 'Shorten, brand and track links in milliseconds'
              : 'Design branded dynamic QR codes in seconds'}
          </Typography>

          {/* Subheading */}
          <Typography
            variant="subtitle1"
            sx={{
              maxWidth: '680px !important',
              mx: 'auto',
              mb: 5,
              color: '#556345',
              lineHeight: 1.6,
              textWrap: 'pretty',
            }}
          >
            {heroMode === 'shortener'
              ? 'Replace long cluttered web addresses with fast Base62 short links and custom domains that protect visitor privacy and deliver clean click metrics.'
              : 'Generate custom QR codes for websites, WhatsApp conversations, and UPI payments with custom brand colors and center logo overlays.'}
          </Typography>

          {/* Interactive Widget Area */}
          {heroMode === 'shortener' ? (
            <Box sx={{ maxWidth: 760, mx: 'auto' }}>
              <Card
                sx={{
                  p: { xs: 2.5, sm: 4 },
                  borderRadius: 4,
                  border: '1px solid #E4E9DC',
                  bgcolor: '#ffffff',
                  boxShadow: '0 8px 30px -4px rgba(88, 117, 41, 0.08)',
                }}
              >
                <CardContent sx={{ p: '0 !important' }}>
                  {/* Guest Limit Alert (only when input form is visible and limit reached) */}
                  {!createdLink && hasReachedGuestLimit && !isAuthenticated && (
                    <Alert
                      severity="warning"
                      sx={{
                        mb: 3,
                        textAlign: 'left',
                        borderRadius: 2,
                        alignItems: 'center',
                        bgcolor: 'rgba(237, 218, 94, 0.25)',
                        border: '1px solid #EDDA5E',
                        color: '#1C2411',
                      }}
                      action={
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          disableElevation
                          disableRipple
                          onClick={() => triggerLeadModal()}
                          sx={{ ml: 2, whiteSpace: 'nowrap' }}
                        >
                          Sign up free
                        </Button>
                      }
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        You used your one free guest link. Create an account to unlock 10 links each month.
                      </Typography>
                    </Alert>
                  )}

                  {error && (
                    <Alert severity="error" sx={{ mb: 3, textAlign: 'left', borderRadius: 2 }}>
                      {error}
                    </Alert>
                  )}

                  {/* Input Form (visible when no link has been created yet) */}
                  {!createdLink && (
                    <Box
                      component="form"
                      onSubmit={handleShorten}
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 1.5,
                        alignItems: 'stretch',
                      }}
                    >
                      <TextField
                        fullWidth
                        placeholder="Paste your long link here (e.g. https://yourbrand.in/article)..."
                        value={destinationUrl}
                        onChange={(e) => setDestinationUrl(e.target.value)}
                        disabled={loading || (hasReachedGuestLimit && !isAuthenticated)}
                        InputProps={{
                          sx: {
                            fontSize: '1rem',
                            borderRadius: 2,
                          },
                        }}
                      />

                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        disableElevation
                        disableRipple
                        disabled={loading || !destinationUrl.trim()}
                        sx={{
                          px: 3.5,
                          py: 1.2,
                          whiteSpace: 'nowrap',
                          minWidth: 150,
                        }}
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Zap size={16} />}
                      >
                        {loading ? 'Shortening...' : 'Shorten link'}
                      </Button>
                    </Box>
                  )}

                  {/* Post Shortening Rebrandly Style Conversion Interface */}
                  {createdLink && (
                    <Box sx={{ mt: 1 }}>
                      {/* Box 1: Shortened Link Success Card */}
                      <Box
                        sx={{
                          p: { xs: 2, sm: 2.5 },
                          bgcolor: '#ffffff',
                          borderRadius: 3,
                          border: '1px solid #E4E9DC',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 2,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                          textAlign: 'left',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, minWidth: 0, flex: 1 }}>
                          {/* Left Icon Pill */}
                          <Box
                            sx={{
                              width: 46,
                              height: 46,
                              borderRadius: 2.5,
                              bgcolor: 'rgba(88, 117, 41, 0.1)',
                              color: '#587529',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              mt: 0.5,
                            }}
                          >
                            <Link2 size={22} />
                          </Box>

                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#556345',
                                fontWeight: 600,
                                display: 'block',
                                mb: 0.5,
                                textWrap: 'pretty',
                              }}
                            >
                              Here is your shortened and trackable link
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                              <Typography
                                component="a"
                                href={createdLink.shortUrl}
                                target="_blank"
                                rel="noreferrer"
                                sx={{
                                  fontSize: { xs: '1.25rem', sm: '1.45rem' },
                                  fontWeight: 700,
                                  color: '#1C2411',
                                  textDecoration: 'underline',
                                  textUnderlineOffset: '4px',
                                  textDecorationColor: '#EDDA5E',
                                  wordBreak: 'break-all',
                                  '&:hover': { color: '#587529' },
                                }}
                              >
                                {createdLink.shortUrl.replace(/^https?:\/\//, '')}
                              </Typography>

                              {/* Action Buttons */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Tooltip title={copied ? 'Copied' : 'Copy link'}>
                                  <IconButton
                                    size="small"
                                    onClick={handleCopy}
                                    disableRipple
                                    sx={{
                                      p: 0.85,
                                      bgcolor: copied ? 'rgba(113, 149, 30, 0.12)' : '#FBFBFA',
                                      border: '1px solid #E4E9DC',
                                      color: copied ? '#71951E' : '#556345',
                                      '&:hover': { bgcolor: '#F4F7EE', color: '#1C2411' },
                                    }}
                                  >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Share link">
                                  <IconButton
                                    size="small"
                                    onClick={handleShare}
                                    disableRipple
                                    sx={{
                                      p: 0.85,
                                      bgcolor: '#FBFBFA',
                                      border: '1px solid #E4E9DC',
                                      color: '#556345',
                                      '&:hover': { bgcolor: '#F4F7EE', color: '#1C2411' },
                                    }}
                                  >
                                    <Share2 size={16} />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="View QR code">
                                  <IconButton
                                    size="small"
                                    onClick={() => setQrModalOpen(true)}
                                    disableRipple
                                    sx={{
                                      p: 0.85,
                                      bgcolor: '#FBFBFA',
                                      border: '1px solid #E4E9DC',
                                      color: '#556345',
                                      '&:hover': { bgcolor: '#F4F7EE', color: '#1C2411' },
                                    }}
                                  >
                                    <QrCode size={16} />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Open destination">
                                  <IconButton
                                    component="a"
                                    href={createdLink.shortUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    size="small"
                                    disableRipple
                                    sx={{
                                      p: 0.85,
                                      bgcolor: '#FBFBFA',
                                      border: '1px solid #E4E9DC',
                                      color: '#556345',
                                      '&:hover': { bgcolor: '#F4F7EE', color: '#1C2411' },
                                    }}
                                  >
                                    <ExternalLink size={16} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                          </Box>
                        </Box>

                        {/* Collapse Toggle Chevron */}
                        <Tooltip title={isDetailsOpen ? 'Hide features' : 'Show features'}>
                          <IconButton
                            size="small"
                            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                            disableRipple
                            sx={{
                              color: '#556345',
                              border: '1px solid #E4E9DC',
                              bgcolor: '#FBFBFA',
                              '&:hover': { bgcolor: '#F4F7EE' },
                            }}
                          >
                            {isDetailsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </IconButton>
                        </Tooltip>
                      </Box>

                      {/* Box 2: Collapsible Feature Teaser Box */}
                      <Collapse in={isDetailsOpen}>
                        <Box
                          sx={{
                            mt: 2,
                            p: { xs: 2.5, sm: 3 },
                            bgcolor: '#ffffff',
                            borderRadius: 3,
                            border: '1px solid #E4E9DC',
                            textAlign: 'left',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 700,
                              color: '#1C2411',
                              mb: 2.5,
                              textWrap: 'balance',
                            }}
                          >
                            Here are more things you can do in URLRef
                          </Typography>

                          <Grid container spacing={2.5}>
                            {/* Left Column: Link Customization Teasers */}
                            <Grid item xs={12} md={7}>
                              {/* Field 1: Edit Destination */}
                              <Box sx={{ mb: 2 }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 600,
                                    color: '#556345',
                                    display: 'block',
                                    mb: 0.75,
                                  }}
                                >
                                  Edit your destination URL
                                </Typography>

                                <Box
                                  onClick={() =>
                                    triggerLeadModal(
                                      'Unlock editable destinations',
                                      'Need to update where your link points? Sign up for free to edit destinations anytime without breaking your printed or shared links.',
                                    )
                                  }
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    px: 2,
                                    py: 1.25,
                                    border: '1px solid #E4E9DC',
                                    borderRadius: 2,
                                    bgcolor: '#FBFBFA',
                                    cursor: 'pointer',
                                    transition: 'border-color 0.15s ease, background-color 0.15s ease',
                                    '&:hover': {
                                      borderColor: '#71951E',
                                      bgcolor: '#ffffff',
                                    },
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: '#1C2411',
                                      fontWeight: 500,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      mr: 1,
                                    }}
                                  >
                                    {createdLink.destinationUrl.replace(/^https?:\/\//, '')}
                                  </Typography>

                                  <Tooltip title="Unlock destination editing">
                                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#556345' }}>
                                      <Shuffle size={16} />
                                    </Box>
                                  </Tooltip>
                                </Box>
                              </Box>

                              {/* Two Sub-fields: Select Domain & Edit Back Half */}
                              <Grid container spacing={1.5}>
                                <Grid item xs={12} sm={6}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontWeight: 600,
                                      color: '#556345',
                                      display: 'block',
                                      mb: 0.75,
                                    }}
                                  >
                                    Select domain
                                  </Typography>

                                  <Box
                                    onClick={() =>
                                      triggerLeadModal(
                                        'Connect custom branded domains',
                                        'Build customer trust and lift click through rates with your own domain name. Sign up for free to connect your domain.',
                                      )
                                    }
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      px: 2,
                                      py: 1.25,
                                      border: '1px solid #E4E9DC',
                                      borderRadius: 2,
                                      bgcolor: '#FBFBFA',
                                      cursor: 'pointer',
                                      transition: 'border-color 0.15s ease, background-color 0.15s ease',
                                      '&:hover': {
                                        borderColor: '#71951E',
                                        bgcolor: '#ffffff',
                                      },
                                    }}
                                  >
                                    <Typography variant="body2" sx={{ color: '#1C2411', fontWeight: 500 }}>
                                      urlref.softics.in
                                    </Typography>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#71951E' }}>
                                      <Lock size={14} />
                                      <ChevronDown size={14} color="#556345" />
                                    </Box>
                                  </Box>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontWeight: 600,
                                      color: '#556345',
                                      display: 'block',
                                      mb: 0.75,
                                    }}
                                  >
                                    Edit back half
                                  </Typography>

                                  <Box
                                    onClick={() =>
                                      triggerLeadModal(
                                        'Customize your link slug',
                                        'Make your links memorable and clean with custom aliases. Sign up for free to personalize your link slugs.',
                                      )
                                    }
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      px: 2,
                                      py: 1.25,
                                      border: '1px solid #E4E9DC',
                                      borderRadius: 2,
                                      bgcolor: '#FBFBFA',
                                      cursor: 'pointer',
                                      transition: 'border-color 0.15s ease, background-color 0.15s ease',
                                      '&:hover': {
                                        borderColor: '#71951E',
                                        bgcolor: '#ffffff',
                                      },
                                    }}
                                  >
                                    <Typography variant="body2" sx={{ color: '#1C2411', fontWeight: 500 }}>
                                      {createdLink.code}
                                    </Typography>

                                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#71951E' }}>
                                      <Lock size={14} />
                                    </Box>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Grid>

                            {/* Right Column: Reports Teaser with Blurred Chart */}
                            <Grid item xs={12} md={5}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 600,
                                  color: '#556345',
                                  display: 'block',
                                  mb: 0.75,
                                }}
                              >
                                Reports
                              </Typography>

                              <Box
                                sx={{
                                  position: 'relative',
                                  height: 122,
                                  border: '1px solid #E4E9DC',
                                  borderRadius: 2,
                                  bgcolor: '#FBFBFA',
                                  p: 1.5,
                                  overflow: 'hidden',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'flex-end',
                                }}
                              >
                                {/* Blurred Bar Chart Simulation */}
                                <Box
                                  sx={{
                                    filter: 'blur(3px)',
                                    opacity: 0.55,
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    justifyContent: 'space-between',
                                    height: 70,
                                    px: 1,
                                    pb: 0.5,
                                  }}
                                >
                                  {[30, 65, 40, 85, 50, 95, 45].map((height, i) => (
                                    <Box
                                      key={i}
                                      sx={{
                                        width: '9%',
                                        height: `${height}%`,
                                        bgcolor: i % 2 === 0 ? '#71951E' : '#EDDA5E',
                                        borderRadius: '3px 3px 0 0',
                                      }}
                                    />
                                  ))}
                                </Box>

                                {/* Simulated X-axis labels */}
                                <Box
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    px: 0.5,
                                    filter: 'blur(2px)',
                                    opacity: 0.45,
                                  }}
                                >
                                  {['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((time) => (
                                    <Typography key={time} variant="caption" sx={{ fontSize: '0.6rem', color: '#556345' }}>
                                      {time}
                                    </Typography>
                                  ))}
                                </Box>

                                {/* Overlay CTA Button */}
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'rgba(255, 255, 255, 0.4)',
                                    backdropFilter: 'blur(1px)',
                                    p: 1.5,
                                  }}
                                >
                                  <Button
                                    variant="contained"
                                    size="small"
                                    disableElevation
                                    disableRipple
                                    onClick={() =>
                                      triggerLeadModal(
                                        'Unlock live audience analytics',
                                        'Discover where your clicks come from, which devices people use, and top referrers in real time. Sign up for free to access full reports.',
                                      )
                                    }
                                    sx={{
                                      bgcolor: '#1C2411',
                                      color: '#ffffff',
                                      fontWeight: 700,
                                      textTransform: 'none',
                                      px: 2.5,
                                      py: 0.9,
                                      borderRadius: 2,
                                      fontSize: '0.85rem',
                                      '&:hover': { bgcolor: '#000000' },
                                    }}
                                  >
                                    Reveal audience data
                                  </Button>
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </Collapse>

                      {/* Box 3: Bottom Upsell Banner */}
                      <Box
                        sx={{
                          mt: 2,
                          p: { xs: 2, sm: 2.5 },
                          bgcolor: '#ffffff',
                          borderRadius: 3,
                          border: '1px solid #E4E9DC',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 2,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 2.5,
                              bgcolor: 'rgba(88, 117, 41, 0.08)',
                              color: '#71951E',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Sparkles size={22} />
                          </Box>
                          <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1C2411', lineHeight: 1.3 }}>
                              Ready to create more links?
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.4 }}>
                              Get started for free and unlock your link management journey
                            </Typography>
                          </Box>
                        </Box>

                        <Button
                          variant="contained"
                          disableElevation
                          disableRipple
                          onClick={handleShortenAnother}
                          sx={{
                            bgcolor: '#1C2411',
                            color: '#ffffff',
                            fontWeight: 700,
                            textTransform: 'none',
                            px: 3,
                            py: 1.1,
                            borderRadius: 2,
                            fontSize: '0.9rem',
                            '&:hover': { bgcolor: '#000000' },
                          }}
                        >
                          Shorten another link
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* Trust Signals */}
                  <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, color: '#556345', fontSize: '0.85rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <ShieldCheck size={16} color="#71951E" />
                      <span>No credit card required</span>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Clock size={16} color="#F4BE38" />
                      <span>Sub 20ms redirects</span>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Lock size={16} color="#587529" />
                      <span>Zero raw IP tracking</span>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ) : (
            <QrStudio
              onDynamicLinkCreated={(link) => {
                setCreatedLink(link);
                setHasReachedGuestLimit(true);
              }}
            />
          )}
        </Container>
      </Box>

      {/* Mandatory Tagline Reveal Section */}
      <TaglineReveal phrase="Every link you share represents your brand. Transform long cluttered URLs into fast branded short links and high converting dynamic QR codes." />

      {/* Problem to Solution Section */}
      <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: '#FBFBFA' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#71951E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Problem to Solution
            </Typography>
            <Typography variant="h3" component="h2" sx={{ fontWeight: 600, mt: 1, color: '#1C2411' }}>
              Why generic shorteners hurt your marketing
            </Typography>
            <Typography variant="body1" sx={{ color: '#556345', mt: 1.5, maxWidth: 620, mx: 'auto' }}>
              Cluttered long links reduce click rates by up to 34 percent, and static QR codes printed on physical packaging become useless the moment a campaign link changes.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Card sx={{ p: 3, height: '100%', bgcolor: '#ffffff', border: '1px solid #E4E9DC' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#D9483B', mb: 1 }}>
                  The old way
                </Typography>
                <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
                  Using generic links that look suspicious to customers. Throwing away printed flyers because a destination URL changed. Paying foreign currency subscriptions that fail on Indian cards.
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card sx={{ p: 3, height: '100%', bgcolor: '#ffffff', border: '1.5px solid #71951E' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#587529', mb: 1 }}>
                  The URLRef way
                </Typography>
                <Typography variant="body2" sx={{ color: '#1C2411', lineHeight: 1.6 }}>
                  Clean branded domains like <code>go.yourbrand.in</code>. Dynamic QR codes that can be updated post print without reprinting flyers. Seamless Indian payments with UPI AutoPay.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Outcome-Driven Benefits */}
      <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#ffffff', borderTop: '1px solid #E4E9DC' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#71951E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Benefits
            </Typography>
            <Typography variant="h3" component="h2" sx={{ fontWeight: 600, mt: 1, color: '#1C2411' }}>
              Built for performance and reliability
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 3, height: '100%', borderRadius: 3, border: '1px solid #E4E9DC' }}>
                <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: 'rgba(113, 149, 30, 0.12)', color: '#587529', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <Zap size={22} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Sub 20ms redirects
                </Typography>
                <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
                  Direct HTTP 302 Found response from indexed database queries without intermediary advertisement pages.
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 3, height: '100%', borderRadius: 3, border: '1px solid #E4E9DC' }}>
                <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: 'rgba(244, 190, 56, 0.18)', color: '#587529', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <QrCode size={22} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Dynamic QR codes
                </Typography>
                <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
                  Generate custom QR codes for WhatsApp and UPI payments. Edit the destination anytime without reprinting.
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 3, height: '100%', borderRadius: 3, border: '1px solid #E4E9DC' }}>
                <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: 'rgba(237, 218, 94, 0.35)', color: '#587529', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <Globe size={22} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Branded domains
                </Typography>
                <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
                  Connect your own subdomain with automated edge SSL through Cloudflare for maximum trust and higher click rates.
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 3, height: '100%', borderRadius: 3, border: '1px solid #E4E9DC' }}>
                <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: 'rgba(88, 117, 41, 0.12)', color: '#587529', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <BarChart3 size={22} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Clean analytics
                </Typography>
                <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
                  Track device types, referring channels, and traffic volume in real time without storing visitor IP addresses.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 3-Step How It Works Section */}
      <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: '#FBFBFA', borderTop: '1px solid #E4E9DC' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#71951E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Workflow
          </Typography>
          <Typography variant="h3" component="h2" sx={{ fontWeight: 600, mt: 1, mb: 6, color: '#1C2411' }}>
            How URLRef works in three steps
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', px: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: '#587529',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  1
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Paste destination
                </Typography>
                <Typography variant="body2" sx={{ color: '#556345' }}>
                  Paste your lengthy web link or choose a WhatsApp or UPI payment intent.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', px: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: '#71951E',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  2
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Customize code or QR
                </Typography>
                <Typography variant="body2" sx={{ color: '#556345' }}>
                  Select an alias or customize QR colors, padding modules, and center brand logos.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', px: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: '#F4BE38',
                    color: '#1C2411',
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  3
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Share and track
                </Typography>
                <Typography variant="body2" sx={{ color: '#556345' }}>
                  Share anywhere. Review clicks, devices, and traffic origins on your private dashboard.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Pricing Matrix Section */}
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
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
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
                  onClick={() => {
                    if (isAuthenticated) {
                      setBillingModalOpen(true);
                    } else {
                      navigate('/register');
                    }
                  }}
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
                  onClick={() => {
                    if (isAuthenticated) {
                      setBillingModalOpen(true);
                    } else {
                      navigate('/register');
                    }
                  }}
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

      {/* Frequently Asked Questions */}
      <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: '#FBFBFA', borderTop: '1px solid #E4E9DC' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#71951E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              FAQ
            </Typography>
            <Typography variant="h3" component="h2" sx={{ fontWeight: 600, mt: 1, color: '#1C2411' }}>
              Frequently asked questions
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Accordion elevation={0} sx={{ border: '1px solid #E4E9DC', borderRadius: '12px !important', bgcolor: '#ffffff', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ChevronDown size={18} color="#587529" />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  What is a dynamic QR code?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
                  A dynamic QR code encodes a short redirect link. If you print packaging or flyers and later need to change where the link points, you can edit the destination in your dashboard without reprinting.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} sx={{ border: '1px solid #E4E9DC', borderRadius: '12px !important', bgcolor: '#ffffff', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ChevronDown size={18} color="#587529" />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  How do custom domains work?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
                  You point a CNAME DNS record to our edge target. Cloudflare for SaaS automatically issues an SSL certificate, and your short links run under your own domain name.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} sx={{ border: '1px solid #E4E9DC', borderRadius: '12px !important', bgcolor: '#ffffff', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ChevronDown size={18} color="#587529" />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Which payment methods are accepted in India?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
                  We support UPI AutoPay through Google Pay, PhonePe, Paytm, and BHIM, as well as domestic debit and credit cards and NetBanking through Razorpay.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} sx={{ border: '1px solid #E4E9DC', borderRadius: '12px !important', bgcolor: '#ffffff', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ChevronDown size={18} color="#587529" />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Can I export QR codes for physical printing?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
                  Yes. The studio generates lossless vector SVG files and high resolution 1024 pixel PNG files suitable for print shops, restaurant tent cards, and product packaging.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} sx={{ border: '1px solid #E4E9DC', borderRadius: '12px !important', bgcolor: '#ffffff', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ChevronDown size={18} color="#587529" />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Do visitors see any interstitial ads or slow redirects?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
                  No. URLRef executes instant HTTP 302 redirects with zero intermediate splash screens, zero ads, and sub 20ms response times powered by our edge database.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} sx={{ border: '1px solid #E4E9DC', borderRadius: '12px !important', bgcolor: '#ffffff', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ChevronDown size={18} color="#587529" />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Can I cancel or change my plan anytime?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
                  Yes. You can upgrade, downgrade, or cancel your subscription at any time directly through your billing portal with zero lock in or cancellation fees.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Container>
      </Box>

      {/* Final Matching CTA */}
      <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: '#18220E', color: '#ffffff', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" component="h2" sx={{ fontWeight: 600, mb: 2, color: '#ffffff' }}>
            Start shortening links and creating branded QRs
          </Typography>
          <Typography variant="body1" sx={{ color: '#EDDA5E', mb: 4, maxWidth: 540, mx: 'auto' }}>
            Join creators and merchants who use URLRef for fast redirects, custom domains, and dynamic QR tracking.
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            disableElevation
            disableRipple
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
            endIcon={<ArrowRight size={18} />}
            sx={{ px: 4, py: 1.4, fontWeight: 700, fontSize: '1rem', textTransform: 'none' }}
          >
            {isAuthenticated ? 'Open dashboard' : 'Create free account'}
          </Button>
        </Container>
      </Box>

      {/* Semantic Footer with Legal Links */}
      <Box component="footer" sx={{ py: 4, bgcolor: '#111709', color: '#556345', borderTop: '1px solid #233014' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '6px', bgcolor: '#587529', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                <Link2 size={16} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff' }}>
                URLRef
              </Typography>
              <Typography variant="caption" sx={{ color: '#EDDA5E' }}>
                by Softics
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 3, fontSize: '0.875rem', alignItems: 'center' }}>
              <Box component="a" href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }} sx={{ color: '#EDDA5E', textDecoration: 'none', '&:hover': { color: '#ffffff' }, cursor: 'pointer' }}>
                Sign in
              </Box>
              <Box component="a" href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }} sx={{ color: '#EDDA5E', textDecoration: 'none', '&:hover': { color: '#ffffff' }, cursor: 'pointer' }}>
                Register
              </Box>
              <Box
                component="button"
                onClick={() => setLegalModal('privacy')}
                sx={{
                  background: 'none',
                  border: 'none',
                  p: 0,
                  color: '#556345',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  '&:hover': { color: '#ffffff' },
                }}
              >
                Privacy policy
              </Box>
              <Box
                component="button"
                onClick={() => setLegalModal('terms')}
                sx={{
                  background: 'none',
                  border: 'none',
                  p: 0,
                  color: '#556345',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  '&:hover': { color: '#ffffff' },
                }}
              >
                Terms of service
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

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

      {/* QR Code Modal for Shortener */}
      <QrCodeModal open={qrModalOpen} link={createdLink} onClose={() => setQrModalOpen(false)} />

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        open={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        title={leadModalConfig.title}
        subtitle={leadModalConfig.subtitle}
      />

      {/* Billing & Subscription Modal */}
      <BillingModal open={billingModalOpen} onClose={() => setBillingModalOpen(false)} />

      {/* Legal & Compliance Modal */}
      <LegalModal open={Boolean(legalModal)} type={legalModal} onClose={() => setLegalModal(null)} />
    </Box>
  );
};
