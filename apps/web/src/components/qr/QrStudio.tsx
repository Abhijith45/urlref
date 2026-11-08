import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Alert,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api-client';
import { LinkDto } from '@shortener/shared';
import { LeadCaptureModal } from '../leads/LeadCaptureModal';
import { ChannelType } from './QrChannelInputs';
import { QrStyleControls } from './QrStyleControls';
import { QrPreviewCard } from './QrPreviewCard';
import { renderQrToCanvas, downloadQrCode } from './qr-export';
import {
  ChannelPayloadInput,
  checkHasInput,
  computeRawPayload,
} from './qr-payload';
import { QrUpsellBanner } from './QrUpsellBanner';
import { QrChannelTabs } from './QrChannelTabs';
import { QrChannelConfigCard } from './QrChannelConfigCard';

interface QrStudioProps {
  initialUrl?: string;
  onDynamicLinkCreated?: (link: LinkDto) => void;
}

export const QrStudio: React.FC<QrStudioProps> = ({ initialUrl = '', onDynamicLinkCreated }) => {
  const { isAuthenticated } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active Channel Tab
  const [channel, setChannel] = useState<ChannelType>('url');

  // Channel Specific Form States
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

  // Dynamic Link State
  const [isDynamic, setIsDynamic] = useState(false);
  const [dynamicLink, setDynamicLink] = useState<LinkDto | null>(null);
  const [shortening, setShortening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lead-capture Modal for unauthenticated guests
  const [leadModalOpen, setLeadModalOpen] = useState(false);

  // Export Settings
  const [exportFormat, setExportFormat] = useState<'png' | 'svg'>('png');
  const [exportSize, setExportSize] = useState<number>(1024);

  const payloadInput: ChannelPayloadInput = {
    channel,
    url,
    whatsappPhone,
    whatsappMsg,
    upiVpa,
    upiName,
    upiAmount,
    emailTo,
    emailSubject,
    emailBody,
    phoneNumber,
    smsPhone,
    smsBody,
    wifiSsid,
    wifiPassword,
    wifiEncryption,
  };

  const hasInput = checkHasInput(payloadInput);
  const currentPayload = isDynamic && dynamicLink ? dynamicLink.shortUrl : computeRawPayload(payloadInput);

  // Re-render canvas when styling or payload changes
  useEffect(() => {
    renderQrToCanvas({
      canvas: canvasRef.current,
      payload: currentPayload,
      margin,
      fgColor,
      bgColor,
      logoImage,
    });
  }, [currentPayload, margin, fgColor, bgColor, logoImage]);

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogoImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Dynamic Shorten
  const handleGenerateDynamic = async () => {
    const targetUrl = computeRawPayload(payloadInput);
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
    await downloadQrCode({
      payload: currentPayload,
      margin,
      fgColor,
      bgColor,
      logoImage,
      exportFormat,
      exportSize,
    });

    if (!isAuthenticated) {
      localStorage.setItem('urlref_guest_qr', 'true');
    }
  };

  // Triggered when user wants to create another QR code
  const handleCreateAnother = () => {
    if (!isAuthenticated) {
      setLeadModalOpen(true);
      return;
    }

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
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 1, sm: 2 }, width: '100%', overflowX: 'hidden' }}>
      {/* Channel Selector Tabs */}
      <QrChannelTabs
        channel={channel}
        onChangeChannel={(ch) => {
          setChannel(ch);
          setIsDynamic(false);
          setDynamicLink(null);
        }}
      />

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Form & Customization */}
        <Grid item xs={12} md={7}>
          <QrChannelConfigCard
            channel={channel}
            url={url}
            setUrl={setUrl}
            whatsappPhone={whatsappPhone}
            setWhatsappPhone={setWhatsappPhone}
            whatsappMsg={whatsappMsg}
            setWhatsappMsg={setWhatsappMsg}
            upiVpa={upiVpa}
            setUpiVpa={setUpiVpa}
            upiName={upiName}
            setUpiName={setUpiName}
            upiAmount={upiAmount}
            setUpiAmount={setUpiAmount}
            emailTo={emailTo}
            setEmailTo={setEmailTo}
            emailSubject={emailSubject}
            setEmailSubject={setEmailSubject}
            emailBody={emailBody}
            setEmailBody={setEmailBody}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            smsPhone={smsPhone}
            setSmsPhone={setSmsPhone}
            smsBody={smsBody}
            setSmsBody={setSmsBody}
            wifiSsid={wifiSsid}
            setWifiSsid={setWifiSsid}
            wifiPassword={wifiPassword}
            setWifiPassword={setWifiPassword}
            wifiEncryption={wifiEncryption}
            setWifiEncryption={setWifiEncryption}
            dynamicLink={dynamicLink}
            shortening={shortening}
            hasInput={hasInput}
            onGenerateDynamic={handleGenerateDynamic}
          />

          {/* Customization Card */}
          <QrStyleControls
            bgColor={bgColor}
            setBgColor={setBgColor}
            fgColor={fgColor}
            setFgColor={setFgColor}
            margin={margin}
            setMargin={setMargin}
            logoImage={logoImage}
            onRemoveLogo={() => setLogoImage(null)}
            onUploadLogo={handleLogoUpload}
          />
        </Grid>

        {/* Right Column: Live QR Preview & Export Controls */}
        <Grid item xs={12} md={5}>
          <QrPreviewCard
            canvasRef={canvasRef}
            hasInput={hasInput}
            currentPayload={currentPayload}
            exportSize={exportSize}
            setExportSize={setExportSize}
            exportFormat={exportFormat}
            setExportFormat={setExportFormat}
            onDownload={handleDownload}
          />
        </Grid>
      </Grid>

      {/* Bottom Lead-Capture Upsell Banner */}
      <QrUpsellBanner onCreateAnother={handleCreateAnother} />

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        open={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        title="Need more QR codes?"
        subtitle="URLRef is the right solution for you! Sign up for free now and unlock 10 links each month, custom vanity slugs, and real time scan analytics."
      />
    </Box>
  );
};
