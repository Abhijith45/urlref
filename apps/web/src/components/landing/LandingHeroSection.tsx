import React from 'react';
import {
  Box,
  Container,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  Alert,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { Sparkles, Zap, ShieldCheck, Clock, Lock } from 'lucide-react';
import { LinkDto } from '@shortener/shared';
import { PostShortenResultView } from './PostShortenResultView';
import { QrStudio } from '../qr/QrStudio';

interface LandingHeroSectionProps {
  heroMode: 'shortener' | 'qr';
  onModeChange: (mode: 'shortener' | 'qr') => void;
  destinationUrl: string;
  setDestinationUrl: (val: string) => void;
  loading: boolean;
  error: string | null;
  createdLink: LinkDto | null;
  copied: boolean;
  hasReachedGuestLimit: boolean;
  isAuthenticated: boolean;
  isDetailsOpen: boolean;
  setIsDetailsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onShorten: (e: React.FormEvent) => void;
  onCopy: () => void;
  onShare: () => void;
  onOpenQrModal: () => void;
  onTriggerLeadModal: (title?: string, subtitle?: string) => void;
  onShortenAnother: () => void;
  onDynamicLinkCreated: (link: LinkDto) => void;
}

export const LandingHeroSection: React.FC<LandingHeroSectionProps> = ({
  heroMode,
  onModeChange,
  destinationUrl,
  setDestinationUrl,
  loading,
  error,
  createdLink,
  copied,
  hasReachedGuestLimit,
  isAuthenticated,
  isDetailsOpen,
  setIsDetailsOpen,
  onShorten,
  onCopy,
  onShare,
  onOpenQrModal,
  onTriggerLeadModal,
  onShortenAnother,
  onDynamicLinkCreated,
}) => {
  return (
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
              if (newMode) onModeChange(newMode);
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
            bgcolor: 'rgba(237, 218, 94, 0.35)',
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

        {/* Hero Heading: Compound SEO Headline */}
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
          Shorten, brand and track links with dynamic QR codes
        </Typography>

        {/* Subheading */}
        <Typography
          variant="subtitle1"
          sx={{
            maxWidth: '680px !important',
            mx: 'auto',
            mb: 4,
            color: '#556345',
            lineHeight: 1.6,
            textWrap: 'pretty',
          }}
        >
          Create high speed branded links and scannable dynamic QR codes with real time privacy first analytics. Built for digital agencies, consumer packaging, and modern creators.
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
                {/* Guest Limit Alert */}
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
                        onClick={() => onTriggerLeadModal()}
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

                {/* Input Form */}
                {!createdLink && (
                  <Box
                    component="form"
                    onSubmit={onShorten}
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

                {/* Post Shortening Conversion View */}
                {createdLink && (
                  <PostShortenResultView
                    createdLink={createdLink}
                    copied={copied}
                    isDetailsOpen={isDetailsOpen}
                    setIsDetailsOpen={setIsDetailsOpen}
                    onCopy={onCopy}
                    onShare={onShare}
                    onOpenQr={onOpenQrModal}
                    onTriggerLeadModal={onTriggerLeadModal}
                    onShortenAnother={onShortenAnother}
                  />
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
          <QrStudio onDynamicLinkCreated={onDynamicLinkCreated} />
        )}
      </Container>
    </Box>
  );
};
