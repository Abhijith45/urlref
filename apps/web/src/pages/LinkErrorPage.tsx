import React from 'react';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { AlertCircle, Clock, Home, ArrowLeft } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface LinkErrorPageProps {
  type: 'not-found' | 'expired';
}

export const LinkErrorPage: React.FC<LinkErrorPageProps> = ({ type }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code') || '';
  const reason = searchParams.get('reason') || '';

  const isExpired = type === 'expired' || reason === 'expired';
  const isDisabled = reason === 'disabled';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#FBFBFA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 6,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3.5, sm: 5 },
            textAlign: 'center',
            borderRadius: 3,
            border: '1px solid #E4E9DC',
            bgcolor: '#ffffff',
            boxShadow: '0 8px 32px -4px rgba(28, 36, 17, 0.06)',
          }}
        >
          {/* Status Icon */}
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: isExpired || isDisabled ? 'rgba(244, 190, 56, 0.18)' : 'rgba(217, 72, 59, 0.12)',
              color: isExpired || isDisabled ? '#B8860B' : '#D9483B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            {isExpired || isDisabled ? <Clock size={32} /> : <AlertCircle size={32} />}
          </Box>

          {/* Heading */}
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1C2411', mb: 1 }}>
            {isDisabled
              ? 'Short Link Disabled'
              : isExpired
              ? 'Short Link Expired'
              : 'Link Not Found'}
          </Typography>

          {/* Subtitle */}
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
            {isDisabled ? (
              <>
                The short link {code ? <code>/{code}</code> : 'you visited'} was deactivated by its owner and is no longer accepting redirects.
              </>
            ) : isExpired ? (
              <>
                The short link {code ? <code>/{code}</code> : 'you visited'} has reached its scheduled expiration date.
              </>
            ) : (
              <>
                The link {code ? <code>/{code}</code> : 'you are trying to visit'} could not be found. It may have been deleted, mistyped, or never existed.
              </>
            )}
          </Typography>

          {/* Suggestion box */}
          <Box
            sx={{
              p: 2,
              mb: 4,
              bgcolor: '#FBFBFA',
              borderRadius: 2,
              border: '1px solid #E4E9DC',
              textAlign: 'left',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#587529', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
              What you can do:
            </Typography>
            <Typography variant="body2" sx={{ color: '#556345', fontSize: '0.85rem' }}>
              &bull; Check the address for typos or missing characters.<br />
              &bull; Contact the person or company who shared this link with you.<br />
              &bull; Create your own fast, branded short links and QR codes for free with URLRef.
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowLeft size={16} />}
              onClick={() => window.history.back()}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderColor: '#E4E9DC',
                color: '#1C2411',
                '&:hover': { borderColor: '#587529', bgcolor: '#FBFBFA' },
              }}
            >
              Go Back
            </Button>

            <Button
              variant="contained"
              startIcon={<Home size={16} />}
              onClick={() => navigate('/')}
              sx={{
                bgcolor: '#587529',
                color: '#ffffff',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { bgcolor: '#465e20' },
              }}
            >
              URLRef Homepage
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
