import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { Copy, Check, Download } from 'lucide-react';
import QRCode from 'qrcode';
import { LinkDto } from '@shortener/shared';

interface QrCodeModalProps {
  open: boolean;
  link: LinkDto | null;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ open, link, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!link) {
      setDataUrl(null);
      return;
    }
    QRCode.toDataURL(link.shortUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: '#1C2411',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error('Failed to generate QR data URL:', err));
  }, [link]);

  if (!link) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(link.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const linkEl = document.createElement('a');
    linkEl.href = dataUrl;
    linkEl.download = `urlref-qr-${link.code}.png`;
    linkEl.click();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
    >
      <DialogTitle sx={{ fontWeight: 700, textAlign: 'center', color: '#1C2411' }}>
        QR Code
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1 }}>
        <Box
          sx={{
            p: 2,
            bgcolor: '#ffffff',
            borderRadius: 2.5,
            border: '1px solid #E4E9DC',
            boxShadow: '0 2px 12px rgba(88, 117, 41, 0.08)',
            mb: 2,
            minHeight: 220,
            minWidth: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR code for ${link.shortUrl}`}
              width={220}
              height={220}
              style={{ display: 'block', borderRadius: 6 }}
            />
          ) : (
            <CircularProgress size={28} />
          )}
        </Box>

        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', mb: 0.5 }}>
          {link.shortUrl}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          Scan with any mobile camera to test instant 302 redirection.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2.5, px: 3, gap: 1 }}>
        <Tooltip title={copied ? 'Copied!' : 'Copy Link'}>
          <Button
            variant="outlined"
            size="small"
            disableElevation
            disableRipple
            onClick={handleCopy}
            startIcon={copied ? <Check size={16} color="#71951E" /> : <Copy size={16} />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </Tooltip>
        <Button
          variant="contained"
          size="small"
          disableElevation
          disableRipple
          disabled={!dataUrl}
          onClick={handleDownload}
          startIcon={<Download size={16} />}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          Download PNG
        </Button>
      </DialogActions>
    </Dialog>
  );
};
