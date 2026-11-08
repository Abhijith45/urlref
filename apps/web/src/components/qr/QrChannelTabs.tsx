import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import {
  Globe,
  MessageCircle,
  IndianRupee,
  Mail,
  Phone,
  MessageSquare,
  Wifi,
} from 'lucide-react';
import { ChannelType } from './QrChannelInputs';

interface QrChannelTabsProps {
  channel: ChannelType;
  onChangeChannel: (ch: ChannelType) => void;
}

export const QrChannelTabs: React.FC<QrChannelTabsProps> = ({
  channel,
  onChangeChannel,
}) => {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, maxWidth: '100%', overflowX: 'auto' }}>
      <Tabs
        value={channel}
        onChange={(_, val) => onChangeChannel(val)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          maxWidth: '100%',
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
  );
};
