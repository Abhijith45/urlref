import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Grid,
  Slider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Globe,
  MessageCircle,
  IndianRupee,
  Mail,
  Phone,
  MessageSquare,
  Wifi,
  Download,
  Upload,
  Trash2,
  Sparkles,
  Zap,
  QrCode,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api-client';
import { LinkDto } from '@shortener/shared';
import { LeadCaptureModal } from '../leads/LeadCaptureModal';

type ChannelType = 'url' | 'whatsapp' | 'upi' | 'email' | 'phone' | 'sms' | 'wifi';

interface QrStudioProps {
  initialUrl?: string;
  onDynamicLinkCreated?: (link: LinkDto) => void;
}

export const QrStudio: React.FC<QrStudioProps> = ({ initialUrl = '', onDynamicLinkCreated }) => {
  const { isAuthenticated } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active Channel Tab
  const [channel, setChannel] = useState<ChannelType>('url');

  // Channel Specific Form States (empty by default per requirements)
  const [url, setUrl] = useState(initialUrl || '');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappMsg, setWhatsappMsg] = useState('');
  const [upiVpa, setUpiVpa] = useState('');
  const [upiName, setUpiName] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsPhone, setSmsPhone] = useState('');
  const [smsBody, setSmsBody] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');

  // Styling States
  const [bgColor, setBgColor] = useState('#ffffff');
  const [fgColor, setFgColor] = useState('#000000');
  const [margin, setMargin] = useState(2);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [exportSize, setExportSize] = useState<number>(512);
  const [exportFormat, setExportFormat] = useState<'png' | 'svg'>('png');

  // Dynamic QR state
  const [isDynamic, setIsDynamic] = useState<boolean>(false);
  const [dynamicLink, setDynamicLink] = useState<LinkDto | null>(null);
  const [shortening, setShortening] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lead capture modal state
  const [leadModalOpen, setLeadModalOpen] = useState(false);

  // Check if current channel has active user input
  const hasInput = Boolean(
    channel === 'url'
      ? url.trim().length > 0
      : channel === 'whatsapp'
        ? whatsappPhone.trim().length > 0
        : channel === 'upi'
          ? upiVpa.trim().length > 0
          : channel === 'email'
            ? emailTo.trim().length > 0
            : channel === 'phone'
              ? phoneNumber.trim().length > 0
              : channel === 'sms'
                ? smsPhone.trim().length > 0
                : wifiSsid.trim().length > 0,
  );

  // Compute raw payload based on channel
  const computePayload = (): string => {
    switch (channel) {
      case 'url':
        return url.trim() || 'https://urlref.softics.in/preview-sample';
      case 'whatsapp': {
        const cleanPhone = whatsappPhone.replace(/[^0-9]/g, '');
        const textParam = whatsappMsg ? `?text=${encodeURIComponent(whatsappMsg)}` : '';
        return cleanPhone ? `https://wa.me/${cleanPhone}${textParam}` : 'https://wa.me/sample';
      }
      case 'upi': {
        if (!upiVpa) return 'upi://pay?pa=merchant@upi&pn=Sample&cu=INR';
        const params = new URLSearchParams();
        params.set('pa', upiVpa.trim());
        if (upiName) params.set('pn', upiName.trim());
        if (upiAmount) params.set('am', upiAmount.trim());
        params.set('cu', 'INR');
        return `upi://pay?${params.toString()}`;
      }
      case 'email':
        return emailTo.trim()
          ? `mailto:${emailTo.trim()}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
          : 'mailto:sample@example.com';
      case 'phone':
        return phoneNumber.trim() ? `tel:${phoneNumber.trim()}` : 'tel:9999999999';
      case 'sms':
        return smsPhone.trim() ? `sms:${smsPhone.trim()}?body=${encodeURIComponent(smsBody)}` : 'sms:9999999999';
      case 'wifi':
        return wifiSsid.trim()
          ? `WIFI:S:${wifiSsid};T:${wifiEncryption};P:${wifiPassword};;`
          : 'WIFI:S:Sample;T:WPA;P:password;;';
      default:
        return 'https://urlref.softics.in/preview-sample';
    }
  };

  const currentPayload = isDynamic && dynamicLink ? dynamicLink.shortUrl : computePayload();

  // Draw QR code onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCode.toCanvas(
      canvas,
      currentPayload,
      {
        width: 300,
        margin,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: 'H', // Forced high error correction to support center logo
      },
      (error) => {
        if (error) {
          console.error('Failed to render QR Code:', error);
          return;
        }

        // Draw center logo if uploaded
        if (logoImage) {
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = logoImage;
          img.onload = () => {
            const logoSize = canvas.width * 0.22; // 22% safe footprint
            const x = (canvas.width - logoSize) / 2;
            const y = (canvas.height - logoSize) / 2;

            // Draw white circular backing pill
            ctx.save();
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2 + 4, 0, Math.PI * 2);
            ctx.fillStyle = bgColor;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#E4E9DC';
            ctx.stroke();

            // Clip and draw logo
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, x, y, logoSize, logoSize);
            ctx.restore();
          };
        }
      },
    );
  }, [currentPayload, bgColor, fgColor, margin, logoImage]);

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Logo size exceeds 2MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Dynamic Shorten
  const handleGenerateDynamic = async () => {
    const targetUrl = computePayload();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      setErrorMessage('Dynamic QRs currently require an HTTP/HTTPS link or web intent (e.g. WhatsApp / Website).');
      return;
    }

    setShortening(true);
    setErrorMessage(null);

    try {
      const endpoint = isAuthenticated ? '/api/v1/links' : '/api/v1/links/public';
      const res = await apiClient.post<{ data: LinkDto }>(endpoint, {
        destinationUrl: targetUrl,
      });

      const newLink = res.data.data;
      setDynamicLink(newLink);
      setIsDynamic(true);

      if (!isAuthenticated) {
        localStorage.setItem('urlref_guest_link', JSON.stringify(newLink));
      }

      if (onDynamicLinkCreated) {
        onDynamicLinkCreated(newLink);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
        if (err.message.includes('free anonymous limit') || err.message.includes('RATE_LIMITED')) {
          setLeadModalOpen(true);
        }
      } else {
        setErrorMessage('Failed to generate dynamic short link.');
      }
    } finally {
      setShortening(false);
    }
  };

  // Export & Download
  const handleDownload = async () => {
    if (exportFormat === 'svg') {
      try {
        const svgString = await QRCode.toString(currentPayload, {
          type: 'svg',
          margin,
          color: { dark: fgColor, light: bgColor },
          errorCorrectionLevel: 'H',
        });
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `urlref-qr-${Date.now()}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Failed to generate SVG:', err);
      }
    } else {
      // High-res canvas export
      const offscreenCanvas = document.createElement('canvas');
      await QRCode.toCanvas(offscreenCanvas, currentPayload, {
        width: exportSize,
        margin,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: 'H',
      });

      if (logoImage) {
        const ctx = offscreenCanvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = logoImage;
          await new Promise<void>((resolve) => {
            img.onload = () => {
              const logoSize = offscreenCanvas.width * 0.22;
              const x = (offscreenCanvas.width - logoSize) / 2;
              const y = (offscreenCanvas.height - logoSize) / 2;

              ctx.save();
              ctx.beginPath();
              ctx.arc(offscreenCanvas.width / 2, offscreenCanvas.height / 2, logoSize / 2 + 8, 0, Math.PI * 2);
              ctx.fillStyle = bgColor;
              ctx.fill();
              ctx.lineWidth = 4;
              ctx.strokeStyle = '#E4E9DC';
              ctx.stroke();

              ctx.beginPath();
              ctx.arc(offscreenCanvas.width / 2, offscreenCanvas.height / 2, logoSize / 2, 0, Math.PI * 2);
              ctx.closePath();
              ctx.clip();
              ctx.drawImage(img, x, y, logoSize, logoSize);
              ctx.restore();
              resolve();
            };
          });
        }
      }

      const pngUrl = offscreenCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `urlref-qr-${exportSize}px.png`;
      a.click();
    }

    if (!isAuthenticated) {
      localStorage.setItem('urlref_guest_qr', 'true');
    }
  };

  // Triggered when user wants to create another QR code
  const handleCreateAnother = () => {
    if (!isAuthenticated) {
      // Rebrandly lead-capture trigger: Prompt modal on unauthenticated action
      setLeadModalOpen(true);
      return;
    }

    // Reset studio for authenticated user
    setDynamicLink(null);
    setIsDynamic(false);
    setUrl('');
    setWhatsappPhone('');
    setWhatsappMsg('');
    setUpiVpa('');
    setUpiName('');
    setUpiAmount('');
    setEmailTo('');
    setEmailSubject('');
    setEmailBody('');
    setPhoneNumber('');
    setSmsPhone('');
    setSmsBody('');
    setWifiSsid('');
    setWifiPassword('');
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      {/* Channel Selector Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={channel}
          onChange={(_, val) => {
            setChannel(val);
            setIsDynamic(false);
            setDynamicLink(null);
          }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              minHeight: 48,
              gap: 1,
            },
          }}
        >
          <Tab icon={<Globe size={18} />} iconPosition="start" label="URL" value="url" />
          <Tab icon={<MessageCircle size={18} />} iconPosition="start" label="WhatsApp" value="whatsapp" />
          <Tab icon={<IndianRupee size={18} />} iconPosition="start" label="UPI Pay" value="upi" />
          <Tab icon={<Mail size={18} />} iconPosition="start" label="Email" value="email" />
          <Tab icon={<Phone size={18} />} iconPosition="start" label="Telephone" value="phone" />
          <Tab icon={<MessageSquare size={18} />} iconPosition="start" label="SMS" value="sms" />
          <Tab icon={<Wifi size={18} />} iconPosition="start" label="WiFi" value="wifi" />
        </Tabs>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Form & Customization */}
        <Grid item xs={12} md={7}>
          {/* Channel Input Card */}
          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #E4E9DC', boxShadow: 'none', mb: 3, bgcolor: '#ffffff' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {channel.toUpperCase()} Configuration
            </Typography>

            {channel === 'url' && (
              <TextField
                fullWidth
                label="Website URL"
                placeholder="https://yourbrand.com/special-offer"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                helperText="Paste any HTTP or HTTPS URL to link with your QR code"
              />
            )}

            {channel === 'whatsapp' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="WhatsApp Phone Number"
                  placeholder="919876543210 (with country code)"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  helperText="Enter phone with country code (e.g. 91 for India)"
                />
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Pre-filled Message (Optional)"
                  placeholder="Hello! I would like to inquire about your product..."
                  value={whatsappMsg}
                  onChange={(e) => setWhatsappMsg(e.target.value)}
                />
              </Box>
            )}

            {channel === 'upi' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="UPI ID / VPA"
                  placeholder="merchant@okhdfcbank or yourname@upi"
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value)}
                  required
                />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Payee Name"
                      placeholder="e.g. Softics Store"
                      value={upiName}
                      onChange={(e) => setUpiName(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Amount in INR (Optional)"
                      placeholder="e.g. 499"
                      value={upiAmount}
                      onChange={(e) => setUpiAmount(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {channel === 'email' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Recipient Email"
                  placeholder="contact@company.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Subject Line"
                  placeholder="Product Inquiry"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Body Message"
                  placeholder="I am interested in..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                />
              </Box>
            )}

            {channel === 'phone' && (
              <TextField
                fullWidth
                label="Telephone Number"
                placeholder="+919876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                helperText="Scanning will prompt user to place a direct phone call"
              />
            )}

            {channel === 'sms' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="SMS Recipient Number"
                  placeholder="+919876543210"
                  value={smsPhone}
                  onChange={(e) => setSmsPhone(e.target.value)}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="SMS Body"
                  placeholder="START"
                  value={smsBody}
                  onChange={(e) => setSmsBody(e.target.value)}
                />
              </Box>
            )}

            {channel === 'wifi' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Network SSID"
                  placeholder="Office-Guest-WiFi"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="WiFi Password"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Encryption</InputLabel>
                  <Select
                    value={wifiEncryption}
                    label="Encryption"
                    onChange={(e) => setWifiEncryption(e.target.value as any)}
                  >
                    <MenuItem value="WPA">WPA/WPA2</MenuItem>
                    <MenuItem value="WEP">WEP</MenuItem>
                    <MenuItem value="nopass">None (Open)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* Dynamic Tracking Option */}
            {(channel === 'url' || channel === 'whatsapp') && (
              <Box sx={{ mt: 2.5, p: 2, bgcolor: 'rgba(88,117,41,0.06)', borderRadius: 2, border: '1px solid rgba(88,117,41,0.2)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Zap size={16} color="#587529" />
                      Dynamic QR Code (Trackable & Editable)
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Update the destination URL anytime after printing without changing the physical QR code.
                    </Typography>
                  </Box>
                  <Button
                    variant={dynamicLink ? 'outlined' : 'contained'}
                    color="primary"
                    size="small"
                    disableRipple
                    disableElevation
                    onClick={handleGenerateDynamic}
                    disabled={shortening || !hasInput}
                    sx={{ textTransform: 'none', fontWeight: 600, ml: 2, whiteSpace: 'nowrap' }}
                  >
                    {shortening ? <CircularProgress size={16} /> : dynamicLink ? 'Re-link' : 'Make Dynamic'}
                  </Button>
                </Box>
                {dynamicLink && (
                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, display: 'block', mt: 1 }}>
                    ✓ Dynamic link active: {dynamicLink.shortUrl}
                  </Typography>
                )}
              </Box>
            )}
          </Card>

          {/* Customization Card */}
          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #E4E9DC', boxShadow: 'none', bgcolor: '#ffffff' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2.5, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Customize Your QR Code
            </Typography>

            <Grid container spacing={3} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
                  Background Color
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    style={{ width: 44, height: 40, border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', padding: 0 }}
                  />
                  <TextField
                    size="small"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    sx={{ width: 110 }}
                  />
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
                  Foreground Color
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    style={{ width: 44, height: 40, border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', padding: 0 }}
                  />
                  <TextField
                    size="small"
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
                    onClick={() => setLogoImage(null)}
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
                  <input type="file" accept="image/png, image/jpeg" hidden onChange={handleLogoUpload} />
                </Button>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Right Column: Live QR Preview & Export Controls */}
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid #E4E9DC',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
              textAlign: 'center',
              bgcolor: '#ffffff',
              position: 'sticky',
              top: 88,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              QR Code Preview
            </Typography>

            {/* Canvas Box */}
            <Box
              sx={{
                p: 2,
                display: 'inline-block',
                borderRadius: 3,
                bgcolor: '#ffffff',
                border: '1px solid #E4E9DC',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                mb: 2.5,
                position: 'relative',
                overflow: 'hidden',
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
                  transition: 'all 250ms ease',
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
                  onChange={(e) => setExportFormat(e.target.value as any)}
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
              onClick={handleDownload}
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
        </Grid>
      </Grid>

      {/* Bottom Lead-Capture Upsell Banner (Rebrandly Style) */}
      <Box
        sx={{
          mt: 4,
          p: { xs: 2.5, sm: 3 },
          borderRadius: 3,
          bgcolor: '#ffffff',
          border: '1px solid #E4E9DC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: 'rgba(88,117,41,0.1)',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={22} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1C2411' }}>
              Ready to create more QR codes?
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Get started for free and unlock 10 links each month, dynamic editable QRs, and real time scan analytics.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          disableElevation
          disableRipple
          onClick={handleCreateAnother}
          sx={{
            bgcolor: '#1C2411',
            color: '#ffffff',
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            py: 1.2,
            borderRadius: 2,
            '&:hover': { bgcolor: '#000000' },
          }}
        >
          Create another QR code
        </Button>
      </Box>

      {/* Rebrandly Style Lead Capture Modal */}
      <LeadCaptureModal
        open={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        title="Need more QR codes?"
        subtitle="URLRef is the right solution for you! Sign up for free now and unlock 10 links each month, custom vanity slugs, and real time scan analytics."
      />
    </Box>
  );
};
