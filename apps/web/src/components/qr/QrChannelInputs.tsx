import React from 'react';
import {
  Box,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

export type ChannelType = 'url' | 'whatsapp' | 'upi' | 'email' | 'phone' | 'sms' | 'wifi';

interface QrChannelInputsProps {
  channel: ChannelType;
  url: string;
  setUrl: (v: string) => void;
  whatsappPhone: string;
  setWhatsappPhone: (v: string) => void;
  whatsappMsg: string;
  setWhatsappMsg: (v: string) => void;
  upiVpa: string;
  setUpiVpa: (v: string) => void;
  upiName: string;
  setUpiName: (v: string) => void;
  upiAmount: string;
  setUpiAmount: (v: string) => void;
  emailTo: string;
  setEmailTo: (v: string) => void;
  emailSubject: string;
  setEmailSubject: (v: string) => void;
  emailBody: string;
  setEmailBody: (v: string) => void;
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  smsPhone: string;
  setSmsPhone: (v: string) => void;
  smsBody: string;
  setSmsBody: (v: string) => void;
  wifiSsid: string;
  setWifiSsid: (v: string) => void;
  wifiPassword: string;
  setWifiPassword: (v: string) => void;
  wifiEncryption: 'WPA' | 'WEP' | 'nopass';
  setWifiEncryption: (v: 'WPA' | 'WEP' | 'nopass') => void;
}

export const QrChannelInputs: React.FC<QrChannelInputsProps> = ({
  channel,
  url,
  setUrl,
  whatsappPhone,
  setWhatsappPhone,
  whatsappMsg,
  setWhatsappMsg,
  upiVpa,
  setUpiVpa,
  upiName,
  setUpiName,
  upiAmount,
  setUpiAmount,
  emailTo,
  setEmailTo,
  emailSubject,
  setEmailSubject,
  emailBody,
  setEmailBody,
  phoneNumber,
  setPhoneNumber,
  smsPhone,
  setSmsPhone,
  smsBody,
  setSmsBody,
  wifiSsid,
  setWifiSsid,
  wifiPassword,
  setWifiPassword,
  wifiEncryption,
  setWifiEncryption,
}) => {
  switch (channel) {
    case 'url':
      return (
        <TextField
          fullWidth
          label="Website URL"
          placeholder="https://yourbrand.com/special-offer"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          helperText="Paste any HTTP or HTTPS URL to link with your QR code"
        />
      );

    case 'whatsapp':
      return (
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
      );

    case 'upi':
      return (
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
      );

    case 'email':
      return (
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
      );

    case 'phone':
      return (
        <TextField
          fullWidth
          label="Telephone Number"
          placeholder="+919876543210"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          helperText="Scanning will prompt user to place a direct phone call"
        />
      );

    case 'sms':
      return (
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
      );

    case 'wifi':
      return (
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
      );

    default:
      return null;
  }
};
