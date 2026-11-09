import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
} from '@mui/material';
import {
  Zap,
  QrCode,
  Globe,
  BarChart3,
} from 'lucide-react';
import { LandingWorkflowSection } from './LandingWorkflowSection';
import { LandingAudienceSolutions } from './LandingAudienceSolutions';

interface LandingFeaturesSectionProps {
  onNavigate: (path: string) => void;
}

const BENEFIT_CARDS = [
  {
    icon: <Zap size={22} />,
    iconBg: 'rgba(113, 149, 30, 0.12)',
    title: 'Sub 20ms redirects',
    desc: 'Direct HTTP 302 Found response from indexed database queries without intermediary advertisement pages.',
  },
  {
    icon: <QrCode size={22} />,
    iconBg: 'rgba(244, 190, 56, 0.18)',
    title: 'Dynamic QR codes',
    desc: 'Generate custom QR codes for WhatsApp and UPI payments. Edit the destination anytime without reprinting.',
  },
  {
    icon: <Globe size={22} />,
    iconBg: 'rgba(237, 218, 94, 0.35)',
    title: 'Branded domains',
    desc: 'Connect your own subdomain with automated free SSL certificates for maximum trust and higher click rates.',
  },
  {
    icon: <BarChart3 size={22} />,
    iconBg: 'rgba(88, 117, 41, 0.12)',
    title: 'Clean analytics',
    desc: 'Track device types, referring channels, and traffic volume in real time without storing visitor IP addresses.',
  },
];

export const LandingFeaturesSection: React.FC<LandingFeaturesSectionProps> = ({ onNavigate }) => {
  return (
    <>
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
            {BENEFIT_CARDS.map((card) => (
              <Grid item xs={12} sm={6} md={3} key={card.title}>
                <Card sx={{ p: 3, height: '100%', borderRadius: 3, border: '1px solid #E4E9DC' }}>
                  <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: card.iconBg, color: '#587529', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    {card.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
                    {card.desc}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 3-Step How It Works Section */}
      <LandingWorkflowSection />

      {/* Audience Sections (Agencies & Packaging) */}
      <LandingAudienceSolutions onNavigate={onNavigate} />
    </>
  );
};
