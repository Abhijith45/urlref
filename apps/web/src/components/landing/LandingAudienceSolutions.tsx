import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  Button,
  Chip,
} from '@mui/material';
import {
  Globe,
  Check,
  Building2,
  Printer,
  Download,
  ArrowRight,
  QrCode,
} from 'lucide-react';

interface LandingAudienceSolutionsProps {
  onNavigate: (path: string) => void;
}

const AGENCY_DEMO_DOMAINS = [
  { domain: 'go.fitnessbrand.in', status: 'Active SSL', links: '342 links' },
  { domain: 'links.organicskincare.com', status: 'Active SSL', links: '215 links' },
  { domain: 'deal.techgadgets.store', status: 'Active SSL', links: '189 links' },
  { domain: 'visit.bistrocafe.in', status: 'Active SSL', links: '94 links' },
  { domain: 'promo.fashionhub.co', status: 'Active SSL', links: '160 links' },
];

export const LandingAudienceSolutions: React.FC<LandingAudienceSolutionsProps> = ({ onNavigate }) => {
  return (
    <>
      {/* Audience Section 1: Built for Marketing Agencies */}
      <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: '#ffffff', borderTop: '1px solid #E4E9DC' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
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
                  mb: 2,
                }}
              >
                <Building2 size={15} color="#587529" />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#587529' }}>
                  Agency Growth Solutions
                </Typography>
              </Box>

              <Typography variant="h3" component="h2" sx={{ fontWeight: 600, color: '#1C2411', mb: 2, textWrap: 'balance' }}>
                Run client campaigns with 5 custom domains on one dashboard
              </Typography>

              <Typography variant="body1" sx={{ color: '#556345', mb: 4, lineHeight: 1.6, textWrap: 'pretty' }}>
                Marketing agencies often pay excessive monthly fees on legacy platforms just to connect a few client domains. URLRef includes 5 branded custom domains on the Growth plan for ₹499 per month, with automated edge SSL and 1,000 monthly links.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(113, 149, 30, 0.15)', color: '#587529', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
                    <Check size={14} />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#1C2411', lineHeight: 1.5 }}>
                    <strong>Multi client branding</strong>: Connect unique client subdomains like <code>links.client.com</code> with instant automated SSL.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(113, 149, 30, 0.15)', color: '#587529', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
                    <Check size={14} />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#1C2411', lineHeight: 1.5 }}>
                    <strong>Bulk link distribution</strong>: Generate short campaign links with custom aliases and zero collision errors.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(113, 149, 30, 0.15)', color: '#587529', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
                    <Check size={14} />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#1C2411', lineHeight: 1.5 }}>
                    <strong>Client ready analytics</strong>: Share clean metrics on geography, device types, and referring channels.
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                disableElevation
                disableRipple
                onClick={() => onNavigate('/solutions/agencies')}
                endIcon={<ArrowRight size={16} />}
                sx={{
                  bgcolor: '#1C2411',
                  color: '#ffffff',
                  fontWeight: 700,
                  px: 3,
                  py: 1.1,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#000000' },
                }}
              >
                Explore agency solutions
              </Button>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3.5, borderRadius: 3, border: '1px solid #E4E9DC', bgcolor: '#FBFBFA' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1C2411', mb: 2 }}>
                  Connected Agency Domains
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {AGENCY_DEMO_DOMAINS.map((item) => (
                    <Box
                      key={item.domain}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.75,
                        borderRadius: 2,
                        bgcolor: '#ffffff',
                        border: '1px solid #E4E9DC',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Globe size={18} color="#587529" />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1C2411' }}>
                          {item.domain}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="caption" sx={{ color: '#556345' }}>
                          {item.links}
                        </Typography>
                        <Chip label={item.status} size="small" sx={{ bgcolor: 'rgba(88, 117, 41, 0.1)', color: '#587529', fontWeight: 700, fontSize: '0.7rem' }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Audience Section 2: Engineered for Packaging & Print */}
      <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: '#FBFBFA', borderTop: '1px solid #E4E9DC' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center" direction={{ xs: 'column-reverse', md: 'row' }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 4, borderRadius: 3, border: '1px solid #E4E9DC', bgcolor: '#ffffff', textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 200,
                    height: 200,
                    mx: 'auto',
                    mb: 3,
                    p: 2,
                    border: '1px solid #E4E9DC',
                    borderRadius: 3,
                    bgcolor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <QrCode size={130} color="#1C2411" />
                  <Typography variant="caption" sx={{ mt: 1, color: '#556345', fontWeight: 600 }}>
                    Lossless Vector SVG Export
                  </Typography>
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1C2411', mb: 0.5 }}>
                  Destination: urlref.softics.in/pack-promo
                </Typography>
                <Typography variant="caption" sx={{ color: '#71951E', fontWeight: 600, display: 'block', mb: 2 }}>
                  Live redirection target can be updated anytime without reprinting
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onNavigate('/solutions/bulk-dynamic-qr')}
                  endIcon={<Download size={14} />}
                  sx={{ borderColor: '#E4E9DC', color: '#1C2411', textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                >
                  Download sample vector CMYK QR
                </Button>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
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
                  mb: 2,
                }}
              >
                <Printer size={15} color="#587529" />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#587529' }}>
                  Print & Physical Collateral
                </Typography>
              </Box>

              <Typography variant="h3" component="h2" sx={{ fontWeight: 600, color: '#1C2411', mb: 2, textWrap: 'balance' }}>
                Dynamic QR codes engineered for physical packaging & print
              </Typography>

              <Typography variant="body1" sx={{ color: '#556345', mb: 4, lineHeight: 1.6, textWrap: 'pretty' }}>
                Printing product packaging, table tents, or event banners is an irreversible expense. If a campaign URL breaks or destination landing page changes, traditional QR codes force costly reprints. URLRef dynamic QR codes route through editable edge redirects that you can update instantly.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(113, 149, 30, 0.15)', color: '#587529', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
                    <Check size={14} />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#1C2411', lineHeight: 1.5 }}>
                    <strong>Zero reprint risk</strong>: Edit the destination URL from your dashboard whenever campaigns change.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(113, 149, 30, 0.15)', color: '#587529', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
                    <Check size={14} />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#1C2411', lineHeight: 1.5 }}>
                    <strong>High resolution vector SVG</strong>: Crisp lines suitable for commercial offset and flexographic printing.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(113, 149, 30, 0.15)', color: '#587529', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
                    <Check size={14} />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#1C2411', lineHeight: 1.5 }}>
                    <strong>Brand logo center</strong>: Automatic 30 percent error recovery keeps QRs scannable even with central graphics.
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                disableElevation
                disableRipple
                onClick={() => onNavigate('/solutions/bulk-dynamic-qr')}
                endIcon={<ArrowRight size={16} />}
                sx={{
                  bgcolor: '#587529',
                  color: '#ffffff',
                  fontWeight: 700,
                  px: 3,
                  py: 1.1,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#465f20' },
                }}
              >
                Learn more about packaging QRs
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
};
