import React from 'react';
import { Box, Container, Typography, Card } from '@mui/material';

export const LandingComparisonSection: React.FC = () => {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: '#ffffff', borderTop: '1px solid #E4E9DC' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#71951E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Comparison
          </Typography>
          <Typography variant="h3" component="h2" sx={{ fontWeight: 600, mt: 1, color: '#1C2411', textWrap: 'balance' }}>
            Why brands switch to URLRef from Bitly
          </Typography>
          <Typography variant="body1" sx={{ color: '#556345', mt: 1.5, maxWidth: 620, mx: 'auto', textWrap: 'pretty' }}>
            Compare features and transparent pricing. Get enterprise level link branding and dynamic vector QRs without prohibitive monthly markups.
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 3, border: '1px solid #E4E9DC', overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 640 }}>
              <Box component="thead" sx={{ bgcolor: '#FBFBFA', borderBottom: '1px solid #E4E9DC' }}>
                <Box component="tr">
                  <Box component="th" sx={{ py: 2, px: 3, fontWeight: 700, color: '#1C2411', fontSize: '0.9rem' }}>Feature</Box>
                  <Box component="th" sx={{ py: 2, px: 3, fontWeight: 700, color: '#587529', fontSize: '0.9rem', bgcolor: 'rgba(88, 117, 41, 0.08)' }}>URLRef (Growth)</Box>
                  <Box component="th" sx={{ py: 2, px: 3, fontWeight: 600, color: '#556345', fontSize: '0.9rem' }}>Bitly (Core)</Box>
                  <Box component="th" sx={{ py: 2, px: 3, fontWeight: 600, color: '#556345', fontSize: '0.9rem' }}>Legacy QR Makers</Box>
                </Box>
              </Box>
              <Box component="tbody" sx={{ '& tr': { borderBottom: '1px solid #E4E9DC' } }}>
                <Box component="tr">
                  <Box component="td" sx={{ py: 2, px: 3, fontWeight: 600, color: '#1C2411' }}>Monthly Price</Box>
                  <Box component="td" sx={{ py: 2, px: 3, fontWeight: 700, color: '#587529', bgcolor: 'rgba(88, 117, 41, 0.04)' }}>₹499 / month</Box>
                  <Box component="td" sx={{ py: 2, px: 3, color: '#556345' }}>$199 / month</Box>
                  <Box component="td" sx={{ py: 2, px: 3, color: '#556345' }}>$15 to $35 / month</Box>
                </Box>
                <Box component="tr">
                  <Box component="td" sx={{ py: 2, px: 3, fontWeight: 600, color: '#1C2411' }}>Custom Branded Domains</Box>
                  <Box component="td" sx={{ py: 2, px: 3, fontWeight: 700, color: '#587529', bgcolor: 'rgba(88, 117, 41, 0.04)' }}>5 Domains included</Box>
                  <Box component="td" sx={{ py: 2, px: 3, color: '#556345' }}>1 Domain</Box>
                  <Box component="td" sx={{ py: 2, px: 3, color: '#556345' }}>None</Box>
                </Box>
                <Box component="tr">
                  <Box component="td" sx={{ py: 2, px: 3, fontWeight: 600, color: '#1C2411' }}>Dynamic Editable QR Codes</Box>
                  <Box component="td" sx={{ py: 2, px: 3, fontWeight: 700, color: '#587529', bgcolor: 'rgba(88, 117, 41, 0.04)' }}>Included with Vector SVG</Box>
                  <Box component="td" sx={{ py: 2, px: 3, color: '#556345' }}>Extra paid add on</Box>
                  <Box component="td" sx={{ py: 2, px: 3, color: '#556345' }}>Locked behind paywall</Box>
                </Box>
                <Box component="tr">
                  <Box component="td" sx={{ py: 2, px: 3, fontWeight: 600, color: '#1C2411' }}>Branded UPI QR with Logo</Box>
                  <Box component="td" sx={{ py: 2, px: 3, fontWeight: 700, color: '#587529', bgcolor: 'rgba(88, 117, 41, 0.04)' }}>Native built in</Box>
                  <Box component="td" sx={{ py: 2, px: 3, color: '#556345' }}>Not supported</Box>
                  <Box component="td" sx={{ py: 2, px: 3, color: '#556345' }}>Not supported</Box>
                </Box>
                <Box component="tr">
                  <Box component="td" sx={{ py: 2, px: 3, fontWeight: 600, color: '#1C2411' }}>Monthly Link Allowance</Box>
                  <Box component="td" sx={{ py: 2, px: 3, fontWeight: 700, color: '#587529', bgcolor: 'rgba(88, 117, 41, 0.04)' }}>1,000 Links</Box>
                  <Box component="td" sx={{ py: 2, px: 3, color: '#556345' }}>100 Links</Box>
                  <Box component="td" sx={{ py: 2, px: 3, color: '#556345' }}>20 to 50 QRs</Box>
                </Box>
                <Box component="tr">
                  <Box component="td" sx={{ py: 2, px: 3, fontWeight: 600, color: '#1C2411' }}>Analytics Retention</Box>
                  <Box component="td" sx={{ py: 2, px: 3, fontWeight: 700, color: '#587529', bgcolor: 'rgba(88, 117, 41, 0.04)' }}>365 Days</Box>
                  <Box component="td" sx={{ py: 2, px: 3, color: '#556345' }}>30 Days</Box>
                  <Box component="td" sx={{ py: 2, px: 3, color: '#556345' }}>30 Days</Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Card>
      </Container>
    </Box>
  );
};
