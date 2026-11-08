import React from 'react';
import { Box, Typography, Tooltip, Grid } from '@mui/material';
import { Shuffle, Lock, ChevronDown } from 'lucide-react';
import { LinkDto } from '@shortener/shared';

interface TeaserCustomizationFieldsProps {
  createdLink: LinkDto;
  onTriggerLeadModal: (title?: string, subtitle?: string) => void;
}

export const TeaserCustomizationFields: React.FC<TeaserCustomizationFieldsProps> = ({
  createdLink,
  onTriggerLeadModal,
}) => {
  return (
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
            onTriggerLeadModal(
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
              onTriggerLeadModal(
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
              onTriggerLeadModal(
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
  );
};
