import React, { useMemo } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  TextField,
  Chip,
  Stack,
  Alert,
} from '@mui/material';
import { ChevronDown, Tag, Sparkles } from 'lucide-react';

export interface UtmValues {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

interface UtmBuilderAccordionProps {
  value: UtmValues;
  destinationUrl: string;
  onChange: (values: UtmValues) => void;
  disabled?: boolean;
}

const COMMON_SOURCES = ['google', 'facebook', 'linkedin', 'twitter', 'newsletter'];
const COMMON_MEDIUMS = ['cpc', 'social', 'email', 'referral', 'display'];

export const UtmBuilderAccordion: React.FC<UtmBuilderAccordionProps> = ({
  value,
  destinationUrl,
  onChange,
  disabled = false,
}) => {
  const handleFieldChange = (field: keyof UtmValues, val: string) => {
    onChange({
      ...value,
      [field]: val,
    });
  };

  const previewUrl = useMemo(() => {
    if (!destinationUrl) return '';
    try {
      const parsed = new URL(destinationUrl);
      if (value.utmSource) parsed.searchParams.set('utm_source', value.utmSource);
      if (value.utmMedium) parsed.searchParams.set('utm_medium', value.utmMedium);
      if (value.utmCampaign) parsed.searchParams.set('utm_campaign', value.utmCampaign);
      if (value.utmTerm) parsed.searchParams.set('utm_term', value.utmTerm);
      if (value.utmContent) parsed.searchParams.set('utm_content', value.utmContent);
      return parsed.toString();
    } catch {
      return '';
    }
  }, [destinationUrl, value]);

  const hasAnyUtm = Boolean(
    value.utmSource || value.utmMedium || value.utmCampaign || value.utmTerm || value.utmContent
  );

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid #E4E9DC',
        borderRadius: '8px !important',
        '&:before': { display: 'none' },
        bgcolor: '#FAFAF8',
      }}
    >
      <AccordionSummary
        expandIcon={<ChevronDown size={18} color="#587529" />}
        sx={{
          px: 2,
          py: 0.5,
          minHeight: 48,
          '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1 },
        }}
      >
        <Sparkles size={16} color="#587529" />
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1C2411' }}>
          UTM Campaign Builder (Optional)
        </Typography>
        {hasAnyUtm && (
          <Chip
            size="small"
            label="Active"
            color="primary"
            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
          />
        )}
      </AccordionSummary>

      <AccordionDetails sx={{ px: 2, pb: 2.5, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.825rem' }}>
          Tag your traffic source, medium, and campaign to track attribution across Google Analytics and URLRef.
        </Typography>

        {/* Source */}
        <Box>
          <TextField
            label="Campaign Source (utm_source)"
            placeholder="e.g. google, newsletter, linkedin"
            fullWidth
            size="small"
            value={value.utmSource || ''}
            onChange={(e) => handleFieldChange('utmSource', e.target.value)}
            disabled={disabled}
            InputProps={{
              startAdornment: <Tag size={14} color="#64748b" style={{ marginRight: 8 }} />,
            }}
          />
          <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: 'wrap', gap: 0.5 }}>
            {COMMON_SOURCES.map((src) => (
              <Chip
                key={src}
                label={src}
                size="small"
                clickable={!disabled}
                onClick={() => handleFieldChange('utmSource', src)}
                variant={value.utmSource === src ? 'filled' : 'outlined'}
                color={value.utmSource === src ? 'primary' : 'default'}
                sx={{ fontSize: '0.725rem', height: 22 }}
              />
            ))}
          </Stack>
        </Box>

        {/* Medium */}
        <Box>
          <TextField
            label="Campaign Medium (utm_medium)"
            placeholder="e.g. cpc, email, social, banner"
            fullWidth
            size="small"
            value={value.utmMedium || ''}
            onChange={(e) => handleFieldChange('utmMedium', e.target.value)}
            disabled={disabled}
          />
          <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: 'wrap', gap: 0.5 }}>
            {COMMON_MEDIUMS.map((med) => (
              <Chip
                key={med}
                label={med}
                size="small"
                clickable={!disabled}
                onClick={() => handleFieldChange('utmMedium', med)}
                variant={value.utmMedium === med ? 'filled' : 'outlined'}
                color={value.utmMedium === med ? 'primary' : 'default'}
                sx={{ fontSize: '0.725rem', height: 22 }}
              />
            ))}
          </Stack>
        </Box>

        {/* Campaign Name */}
        <TextField
          label="Campaign Name (utm_campaign)"
          placeholder="e.g. spring_sale, agency_launch, promo2026"
          fullWidth
          size="small"
          value={value.utmCampaign || ''}
          onChange={(e) => handleFieldChange('utmCampaign', e.target.value)}
          disabled={disabled}
        />

        {/* Term & Content */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
          <TextField
            label="Campaign Term (utm_term)"
            placeholder="Keywords (e.g. running+shoes)"
            fullWidth
            size="small"
            value={value.utmTerm || ''}
            onChange={(e) => handleFieldChange('utmTerm', e.target.value)}
            disabled={disabled}
          />
          <TextField
            label="Campaign Content (utm_content)"
            placeholder="Creative / Variant (e.g. banner_top)"
            fullWidth
            size="small"
            value={value.utmContent || ''}
            onChange={(e) => handleFieldChange('utmContent', e.target.value)}
            disabled={disabled}
          />
        </Box>

        {/* Live Preview */}
        {hasAnyUtm && previewUrl && (
          <Alert
            severity="info"
            sx={{
              bgcolor: 'rgba(88, 117, 41, 0.06)',
              color: '#1C2411',
              border: '1px solid rgba(88, 117, 41, 0.2)',
              fontSize: '0.75rem',
              py: 0.5,
              wordBreak: 'break-all',
              '& .MuiAlert-message': { width: '100%' },
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.25, color: '#587529' }}>
              Destination with UTM Tagging:
            </Typography>
            <Box
              component="code"
              sx={{
                fontFamily: 'Geist Mono, monospace',
                fontSize: '0.75rem',
                color: '#2d3748',
              }}
            >
              {previewUrl}
            </Box>
          </Alert>
        )}
      </AccordionDetails>
    </Accordion>
  );
};
