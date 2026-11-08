import React from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';

const WORKFLOW_STEPS = [
  {
    step: '1',
    bgcolor: '#587529',
    textColor: '#ffffff',
    title: 'Paste destination',
    desc: 'Paste your lengthy web link or choose a WhatsApp or UPI payment intent.',
  },
  {
    step: '2',
    bgcolor: '#71951E',
    textColor: '#ffffff',
    title: 'Customize code or QR',
    desc: 'Select an alias or customize QR colors, padding modules, and center brand logos.',
  },
  {
    step: '3',
    bgcolor: '#F4BE38',
    textColor: '#1C2411',
    title: 'Share and track',
    desc: 'Share anywhere. Review clicks, devices, and traffic origins on your private dashboard.',
  },
];

export const LandingWorkflowSection: React.FC = () => {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: '#FBFBFA', borderTop: '1px solid #E4E9DC' }}>
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#71951E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Workflow
        </Typography>
        <Typography variant="h3" component="h2" sx={{ fontWeight: 600, mt: 1, mb: 6, color: '#1C2411' }}>
          How URLRef works in three steps
        </Typography>

        <Grid container spacing={4}>
          {WORKFLOW_STEPS.map((s) => (
            <Grid item xs={12} md={4} key={s.step}>
              <Box sx={{ textAlign: 'center', px: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: s.bgcolor,
                    color: s.textColor,
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {s.step}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {s.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#556345' }}>
                  {s.desc}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
