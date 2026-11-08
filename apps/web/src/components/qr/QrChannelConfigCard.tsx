import React from 'react';
import { Card, Typography } from '@mui/material';
import { LinkDto } from '@shortener/shared';
import { QrChannelInputs, ChannelType } from './QrChannelInputs';
import { QrDynamicOption } from './QrDynamicOption';

interface QrChannelConfigCardProps {
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
  dynamicLink: LinkDto | null;
  shortening: boolean;
  hasInput: boolean;
  onGenerateDynamic: () => void;
}

export const QrChannelConfigCard: React.FC<QrChannelConfigCardProps> = ({
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
  dynamicLink,
  shortening,
  hasInput,
  onGenerateDynamic,
}) => {
  return (
    <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #E4E9DC', boxShadow: 'none', mb: 3, bgcolor: '#ffffff' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {channel.toUpperCase()} Configuration
      </Typography>

      <QrChannelInputs
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
      />

      {/* Dynamic Tracking Option */}
      {(channel === 'url' || channel === 'whatsapp') && (
        <QrDynamicOption
          dynamicLink={dynamicLink}
          shortening={shortening}
          hasInput={hasInput}
          onGenerateDynamic={onGenerateDynamic}
        />
      )}
    </Card>
  );
};
