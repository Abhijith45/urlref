import { ChannelType } from './QrChannelInputs';

export interface ChannelPayloadInput {
  channel: ChannelType;
  url: string;
  whatsappPhone: string;
  whatsappMsg: string;
  upiVpa: string;
  upiName: string;
  upiAmount: string;
  emailTo: string;
  emailSubject: string;
  emailBody: string;
  phoneNumber: string;
  smsPhone: string;
  smsBody: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiEncryption: 'WPA' | 'WEP' | 'nopass';
}

export function checkHasInput(input: ChannelPayloadInput): boolean {
  switch (input.channel) {
    case 'url':
      return input.url.trim().length > 0;
    case 'whatsapp':
      return input.whatsappPhone.trim().length > 0;
    case 'upi':
      return input.upiVpa.trim().length > 0;
    case 'email':
      return input.emailTo.trim().length > 0;
    case 'phone':
      return input.phoneNumber.trim().length > 0;
    case 'sms':
      return input.smsPhone.trim().length > 0;
    case 'wifi':
      return input.wifiSsid.trim().length > 0;
    default:
      return false;
  }
}

export function computeRawPayload(input: ChannelPayloadInput): string {
  switch (input.channel) {
    case 'url':
      return input.url.trim() || 'https://urlref.softics.in';
    case 'whatsapp': {
      const cleanPhone = input.whatsappPhone.replace(/[^0-9]/g, '');
      const encodedMsg = encodeURIComponent(input.whatsappMsg);
      return cleanPhone
        ? `https://wa.me/${cleanPhone}${input.whatsappMsg ? `?text=${encodedMsg}` : ''}`
        : 'https://wa.me/';
    }
    case 'upi': {
      const cleanVpa = input.upiVpa.trim();
      const params = new URLSearchParams();
      params.set('pa', cleanVpa);
      if (input.upiName.trim()) params.set('pn', input.upiName.trim());
      if (input.upiAmount.trim()) params.set('am', input.upiAmount.trim());
      params.set('cu', 'INR');
      return cleanVpa ? `upi://pay?${params.toString()}` : 'upi://pay';
    }
    case 'email':
      return input.emailTo.trim()
        ? `mailto:${input.emailTo.trim()}?subject=${encodeURIComponent(input.emailSubject)}&body=${encodeURIComponent(input.emailBody)}`
        : 'mailto:contact@example.com';
    case 'phone':
      return input.phoneNumber.trim() ? `tel:${input.phoneNumber.trim()}` : 'tel:+919999999999';
    case 'sms':
      return input.smsPhone.trim()
        ? `sms:${input.smsPhone.trim()}?body=${encodeURIComponent(input.smsBody)}`
        : 'sms:+919999999999';
    case 'wifi':
      return input.wifiSsid.trim()
        ? `WIFI:S:${input.wifiSsid};T:${input.wifiEncryption};P:${input.wifiPassword};;`
        : 'WIFI:S:Sample;T:WPA;P:password;;';
    default:
      return 'https://urlref.softics.in/preview-sample';
  }
}
