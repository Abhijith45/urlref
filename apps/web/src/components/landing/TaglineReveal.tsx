import React, { useEffect, useRef, useState } from 'react';
import { Box, Container, Typography } from '@mui/material';

interface TaglineRevealProps {
  phrase?: string;
}

export const TaglineReveal: React.FC<TaglineRevealProps> = ({
  phrase = 'Every link you share is a direct reflection of your brand. Turn long cluttered addresses into fast branded short links and high converting dynamic QR codes in seconds.',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeWordCount, setActiveWordCount] = useState<number>(0);
  const words = phrase.split(' ');

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setActiveWordCount(words.length);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const rect = container.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Progress calculates from when top enters bottom of screen until center of screen
        const start = windowHeight * 0.85;
        const end = windowHeight * 0.35;

        if (rect.top > start) {
          setActiveWordCount(0);
        } else if (rect.top < end) {
          setActiveWordCount(words.length);
        } else {
          const ratio = (start - rect.top) / (start - end);
          const count = Math.min(words.length, Math.floor(ratio * words.length));
          setActiveWordCount(count);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [words.length]);

  return (
    <Box
      ref={containerRef}
      component="section"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: '#ffffff',
        borderTop: '1px solid #E4E9DC',
        borderBottom: '1px solid #E4E9DC',
      }}
    >
      <Container maxWidth="md" sx={{ textAlign: 'center', maxWidth: '680px !important' }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#71951E',
            display: 'block',
            mb: 2,
          }}
        >
          The URLRef Standard
        </Typography>

        <Typography
          variant="h3"
          component="h2"
          sx={{
            fontWeight: 600,
            lineHeight: { xs: 1.25, md: 1.2 },
            letterSpacing: '-0.025em',
            textWrap: 'balance',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.3em',
          }}
        >
          {words.map((word, index) => {
            const isActive = index < activeWordCount;
            return (
              <Box
                component="span"
                key={index}
                sx={{
                  display: 'inline-block',
                  color: isActive ? '#1C2411' : '#556345',
                  opacity: isActive ? 1 : 0.3,
                  transition: 'opacity 500ms cubic-bezier(0.22, 1, 0.36, 1), color 500ms cubic-bezier(0.22, 1, 0.36, 1)',
                  transform: isActive ? 'translateY(0)' : 'translateY(2px)',
                }}
              >
                {word}
              </Box>
            );
          })}
        </Typography>
      </Container>
    </Box>
  );
};
