import React from 'react';
import { Card, Typography, Grid, Box, TextField, Slider, Button } from '@mui/material';
import { Upload, Trash2 } from 'lucide-react';

interface QrStyleControlsProps {
  bgColor: string;
  setBgColor: (v: string) => void;
  fgColor: string;
  setFgColor: (v: string) => void;
  margin: number;
  setMargin: (v: number) => void;
  logoImage: string | null;
  onRemoveLogo: () => void;
  onUploadLogo: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const QrStyleControls: React.FC<QrStyleControlsProps> = ({
  bgColor,
  setBgColor,
  fgColor,
  setFgColor,
  margin,
  setMargin,
  logoImage,
  onRemoveLogo,
  onUploadLogo,
}) => {
  return (
    <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #E4E9DC', boxShadow: 'none', bgcolor: '#ffffff' }}>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, mb: 2.5, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em' }}
      >
        Customize Your QR Code
      </Typography>

      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
            Background Color
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              type="color"
              aria-label="Background Color Picker"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              style={{ width: 44, height: 40, border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', padding: 0 }}
            />
            <TextField
              size="small"
              inputProps={{ 'aria-label': 'Background Color Hex Code' }}
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              sx={{ width: 110 }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
            Foreground Color
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              type="color"
              aria-label="Foreground Color Picker"
              value={fgColor}
              onChange={(e) => setFgColor(e.target.value)}
              style={{ width: 44, height: 40, border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', padding: 0 }}
            />
            <TextField
              size="small"
              inputProps={{ 'aria-label': 'Foreground Color Hex Code' }}
              value={fgColor}
              onChange={(e) => setFgColor(e.target.value)}
              sx={{ width: 110 }}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Margin Slider */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>
          Margin (Border Padding): {margin} modules
        </Typography>
        <Slider
          value={margin}
          min={0}
          max={4}
          step={1}
          marks
          onChange={(_, val) => setMargin(val as number)}
          size="small"
        />
      </Box>

      {/* Upload Logo */}
      <Box sx={{ p: 2, border: '1px dashed #E4E9DC', borderRadius: 2, bgcolor: '#FBFBFA', textAlign: 'center' }}>
        {logoImage ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <img src={logoImage} alt="Center Logo" style={{ width: 42, height: 42, borderRadius: 6, objectFit: 'contain' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Custom Center Logo Added
              </Typography>
            </Box>
            <Button
              size="small"
              color="error"
              disableRipple
              disableElevation
              startIcon={<Trash2 size={16} />}
              onClick={onRemoveLogo}
              sx={{ textTransform: 'none' }}
            >
              Remove
            </Button>
          </Box>
        ) : (
          <Button
            component="label"
            variant="outlined"
            size="small"
            disableRipple
            disableElevation
            startIcon={<Upload size={16} />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Upload Center Logo (PNG/JPG, Max 2MB)
            <input type="file" accept="image/png, image/jpeg" hidden onChange={onUploadLogo} />
          </Button>
        )}
      </Box>
    </Card>
  );
};
