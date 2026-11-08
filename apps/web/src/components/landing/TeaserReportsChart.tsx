import React from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';

const CHART_BARS = [
  { day: 'mon', h: 30 },
  { day: 'tue', h: 65 },
  { day: 'wed', h: 40 },
  { day: 'thu', h: 85 },
  { day: 'fri', h: 50 },
  { day: 'sat', h: 95 },
  { day: 'sun', h: 45 },
];

const TIME_LABELS = ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

interface TeaserReportsChartProps {
  onTriggerLeadModal: (title?: string, subtitle?: string) => void;
}

export const TeaserReportsChart: React.FC<TeaserReportsChartProps> = ({ onTriggerLeadModal }) => {
  return (
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
          {CHART_BARS.map((bar, i) => (
            <Box
              key={bar.day}
              sx={{
                width: '9%',
                height: `${bar.h}%`,
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
          {TIME_LABELS.map((time) => (
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
              onTriggerLeadModal(
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
  );
};
