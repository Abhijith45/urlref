import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from '@mui/material';
import { ChevronDown, ArrowRight } from 'lucide-react';

export interface FeatureItem {
  title: string;
  desc: string;
  icon: React.ReactNode;
  bg: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

interface MarketingFeatureGridProps {
  items: FeatureItem[];
}

export const MarketingFeatureGrid: React.FC<MarketingFeatureGridProps> = ({ items }) => {
  return (
    <Grid container spacing={4}>
      {items.map((feat) => (
        <Grid item xs={12} md={4} key={feat.title}>
          <Card sx={{ p: 3.5, height: '100%', borderRadius: 3, border: '1px solid #E4E9DC' }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: feat.bg,
                color: '#587529',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              {feat.icon}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {feat.title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
              {feat.desc}
            </Typography>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

interface MarketingFaqAccordionProps {
  faqs: FaqItem[];
}

export const MarketingFaqAccordion: React.FC<MarketingFaqAccordionProps> = ({ faqs }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {faqs.map((faq) => (
        <Accordion
          key={faq.q}
          elevation={0}
          sx={{
            border: '1px solid #E4E9DC',
            borderRadius: '12px !important',
            bgcolor: '#ffffff',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary expandIcon={<ChevronDown size={18} color="#587529" />}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {faq.q}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.6 }}>
              {faq.a}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

interface MarketingFaqSectionProps {
  caption: string;
  title: string;
  faqs: FaqItem[];
}

export const MarketingFaqSection: React.FC<MarketingFaqSectionProps> = ({ caption, title, faqs }) => {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: '#FBFBFA', borderTop: '1px solid #E4E9DC' }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#71951E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {caption}
          </Typography>
          <Typography variant="h3" component="h2" sx={{ fontWeight: 600, mt: 1, color: '#1C2411' }}>
            {title}
          </Typography>
        </Box>

        <MarketingFaqAccordion faqs={faqs} />
      </Container>
    </Box>
  );
};

interface MarketingBottomCtaProps {
  title: string;
  subtitle: string;
  buttonText: string;
  onAction: () => void;
}

export const MarketingBottomCta: React.FC<MarketingBottomCtaProps> = ({
  title,
  subtitle,
  buttonText,
  onAction,
}) => {
  return (
    <Box component="section" sx={{ py: 8, bgcolor: '#18220E', color: '#ffffff', textAlign: 'center' }}>
      <Container maxWidth="md">
        <Typography variant="h3" sx={{ fontWeight: 600, mb: 2, color: '#ffffff' }}>
          {title}
        </Typography>
        <Typography variant="body1" sx={{ color: '#EDDA5E', mb: 4, maxWidth: 540, mx: 'auto' }}>
          {subtitle}
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          disableElevation
          disableRipple
          onClick={onAction}
          endIcon={<ArrowRight size={18} />}
          sx={{ px: 4, py: 1.4, fontWeight: 700, fontSize: '1rem', textTransform: 'none' }}
        >
          {buttonText}
        </Button>
      </Container>
    </Box>
  );
};
