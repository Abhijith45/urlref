import React from 'react';
import {
  Box,
  Typography,
  Tooltip,
  IconButton,
  Button,
} from '@mui/material';
import {
  Link2,
  Copy,
  Check,
  Share2,
  QrCode,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { LinkDto } from '@shortener/shared';
import { PostShortenTeasers } from './PostShortenTeasers';

interface PostShortenResultViewProps {
  createdLink: LinkDto;
  copied: boolean;
  isDetailsOpen: boolean;
  setIsDetailsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onCopy: () => void;
  onShare: () => void;
  onOpenQr: () => void;
  onTriggerLeadModal: (title?: string, subtitle?: string) => void;
  onShortenAnother: () => void;
}

export const PostShortenResultView: React.FC<PostShortenResultViewProps> = ({
  createdLink,
  copied,
  isDetailsOpen,
  setIsDetailsOpen,
  onCopy,
  onShare,
  onOpenQr,
  onTriggerLeadModal,
  onShortenAnother,
}) => {
  return (
    <Box sx={{ mt: 1 }}>
      {/* Box 1: Shortened Link Success Card */}
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          bgcolor: '#ffffff',
          borderRadius: 3,
          border: '1px solid #E4E9DC',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          textAlign: 'left',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: 'rgba(88, 117, 41, 0.1)',
              color: '#587529',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Link2 size={22} />
          </Box>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            {/* Shortened URL with inline quick actions */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1.5,
                mb: 0.75,
              }}
            >
              <Typography
                variant="h6"
                component="a"
                href={createdLink.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  fontWeight: 700,
                  color: '#1C2411',
                  textDecoration: 'none',
                  fontSize: { xs: '1.05rem', sm: '1.25rem' },
                  letterSpacing: '-0.01em',
                  wordBreak: 'break-all',
                  '&:hover': { color: '#587529' },
                }}
              >
                {createdLink.shortUrl.replace(/^https?:\/\//, '')}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Tooltip title={copied ? 'Copied to clipboard!' : 'Copy link'}>
                  <IconButton
                    size="small"
                    onClick={onCopy}
                    disableRipple
                    sx={{
                      color: copied ? '#587529' : '#556345',
                      bgcolor: copied ? 'rgba(88, 117, 41, 0.1)' : 'transparent',
                      border: '1px solid #E4E9DC',
                      p: 0.75,
                      '&:hover': { bgcolor: '#F4F7EE' },
                    }}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Share link">
                  <IconButton
                    size="small"
                    onClick={onShare}
                    disableRipple
                    sx={{
                      color: '#556345',
                      border: '1px solid #E4E9DC',
                      p: 0.75,
                      '&:hover': { bgcolor: '#F4F7EE' },
                    }}
                  >
                    <Share2 size={16} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="View & download QR code">
                  <IconButton
                    size="small"
                    onClick={onOpenQr}
                    disableRipple
                    sx={{
                      color: '#556345',
                      border: '1px solid #E4E9DC',
                      p: 0.75,
                      '&:hover': { bgcolor: '#F4F7EE' },
                    }}
                  >
                    <QrCode size={16} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Visit destination in new tab">
                  <IconButton
                    size="small"
                    component="a"
                    href={createdLink.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    disableRipple
                    sx={{
                      color: '#556345',
                      border: '1px solid #E4E9DC',
                      p: 0.75,
                      '&:hover': { bgcolor: '#F4F7EE' },
                    }}
                  >
                    <ExternalLink size={16} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Destination URL preview snippet */}
            <Typography
              variant="body2"
              sx={{
                color: '#556345',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: { xs: 260, sm: 460 },
              }}
            >
              Redirects to: {createdLink.destinationUrl}
            </Typography>
          </Box>
        </Box>

        {/* Collapse Toggle Chevron */}
        <Tooltip title={isDetailsOpen ? 'Hide features' : 'Show features'}>
          <IconButton
            size="small"
            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
            disableRipple
            sx={{
              color: '#556345',
              border: '1px solid #E4E9DC',
              bgcolor: '#FBFBFA',
              '&:hover': { bgcolor: '#F4F7EE' },
            }}
          >
            {isDetailsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Box 2: Collapsible Feature Teaser Box */}
      <PostShortenTeasers
        createdLink={createdLink}
        isOpen={isDetailsOpen}
        onTriggerLeadModal={onTriggerLeadModal}
      />

      {/* Box 3: Bottom Upsell Banner */}
      <Box
        sx={{
          mt: 2,
          p: { xs: 2, sm: 2.5 },
          bgcolor: '#ffffff',
          borderRadius: 3,
          border: '1px solid #E4E9DC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: 'rgba(88, 117, 41, 0.08)',
              color: '#71951E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={22} />
          </Box>
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1C2411', lineHeight: 1.3 }}>
              Ready to create more links?
            </Typography>
            <Typography variant="body2" sx={{ color: '#556345', lineHeight: 1.4 }}>
              Get started for free and unlock your link management journey
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          disableElevation
          disableRipple
          onClick={onShortenAnother}
          sx={{
            bgcolor: '#1C2411',
            color: '#ffffff',
            fontWeight: 700,
            textTransform: 'none',
            px: 3,
            py: 1.1,
            borderRadius: 2,
            fontSize: '0.9rem',
            '&:hover': { bgcolor: '#000000' },
          }}
        >
          Shorten another link
        </Button>
      </Box>
    </Box>
  );
};
