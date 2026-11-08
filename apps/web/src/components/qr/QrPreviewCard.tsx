import React from 'react';
import {
  Box,
  Card,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import { QrCode, Download } from 'lucide-react';

interface QrPreviewCardProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  hasInput: boolean;
  currentPayload: string;
  exportSize: number;
  setExportSize: (val: number) => void;
  exportFormat: 'png' | 'svg';
  setExportFormat: (val: 'png' | 'svg') => void;
  onDownload: () => void;
}

export const QrPreviewCard: React.FC<QrPreviewCardProps> = ({
  canvasRef,
  hasInput,
  currentPayload,
  exportSize,
  setExportSize,
  exportFormat,
  setExportFormat,
  onDownload,
}) => {
  return (
    <Card
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        border: '1px solid #E4E9DC',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
        textAlign: 'center',
        bgcolor: '#ffffff',
        position: { xs: 'static', md: 'sticky' },
        top: { xs: 'auto', md: 88 },
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, mb: 2, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em' }}
      >
        QR Code Preview
      </Typography>

      {/* Canvas Box */}
      <Box
        sx={{
          p: { xs: 1, sm: 2 },
          display: 'inline-block',
          borderRadius: 3,
          bgcolor: '#ffffff',
          border: '1px solid #E4E9DC',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          mb: 2.5,
          position: 'relative',
          overflow: 'hidden',
          maxWidth: '100%',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
            filter: !hasInput ? 'grayscale(100%) opacity(0.25) blur(1px)' : 'none',
            clipPath: !hasInput ? 'polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%)' : 'none',
            transition: 'filter 250ms ease, clip-path 250ms ease, opacity 250ms ease',
          }}
        />

        {/* Cropped / Inactive Preview Overlay when empty */}
        {!hasInput && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(251, 251, 250, 0.85)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
              textAlign: 'center',
              zIndex: 2,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: 'rgba(88, 117, 41, 0.1)',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
                border: '1px solid rgba(88, 117, 41, 0.25)',
              }}
            >
              <QrCode size={22} />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1C2411', mb: 0.5 }}>
              QR preview inactive
            </Typography>
            <Typography variant="caption" sx={{ color: '#556345', maxWidth: 190, display: 'block', lineHeight: 1.4 }}>
              Enter your details on the left to generate your live scannable QR code
            </Typography>
          </Box>
        )}
      </Box>

      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3, px: 2, wordBreak: 'break-all' }}>
        Target: {hasInput ? currentPayload : 'Awaiting your input'}
      </Typography>

      {/* Export Settings */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Resolution</InputLabel>
          <Select
            value={exportSize}
            label="Resolution"
            onChange={(e) => setExportSize(e.target.value as number)}
          >
            <MenuItem value={256}>256 x 256 px</MenuItem>
            <MenuItem value={512}>512 x 512 px (HD)</MenuItem>
            <MenuItem value={1024}>1024 x 1024 px (Print)</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Format</InputLabel>
          <Select
            value={exportFormat}
            label="Format"
            onChange={(e) => setExportFormat(e.target.value as 'png' | 'svg')}
          >
            <MenuItem value="png">PNG (Bitmap)</MenuItem>
            <MenuItem value="svg">SVG (Vector)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Download CTA */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        disableRipple
        disableElevation
        onClick={onDownload}
        disabled={!hasInput}
        startIcon={<Download size={18} />}
        sx={{
          py: 1.3,
          borderRadius: 2,
          fontWeight: 700,
          textTransform: 'none',
          fontSize: '1rem',
          boxShadow: hasInput ? '0 4px 14px rgba(88,117,41,0.25)' : 'none',
          mb: 1.5,
        }}
      >
        {hasInput ? `Download ${exportFormat.toUpperCase()}` : 'Enter details to download'}
      </Button>
    </Card>
  );
};
