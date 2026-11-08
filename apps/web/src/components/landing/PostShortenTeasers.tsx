import React from 'react';
import {
  Box,
  Typography,
  Collapse,
  Grid,
} from '@mui/material';
import { LinkDto } from '@shortener/shared';
import { TeaserCustomizationFields } from './TeaserCustomizationFields';
import { TeaserReportsChart } from './TeaserReportsChart';

interface PostShortenTeasersProps {
  createdLink: LinkDto;
  isOpen: boolean;
  onTriggerLeadModal: (title?: string, subtitle?: string) => void;
}

export const PostShortenTeasers: React.FC<PostShortenTeasersProps> = ({
  createdLink,
  isOpen,
  onTriggerLeadModal,
}) => {
  return (
    <Collapse in={isOpen}>
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
          <TeaserCustomizationFields
            createdLink={createdLink}
            onTriggerLeadModal={onTriggerLeadModal}
          />

          <TeaserReportsChart onTriggerLeadModal={onTriggerLeadModal} />
        </Grid>
      </Box>
    </Collapse>
  );
};
