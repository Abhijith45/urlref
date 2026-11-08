import { useState, useEffect } from 'react';
import { apiClient } from '../services/api-client';
import { LinkDto } from '@shortener/shared';

const GUEST_LINK_KEY = 'urlref_guest_link';

interface UseLandingShortenerProps {
  isAuthenticated: boolean;
  onOpenLeadModal: (title?: string, subtitle?: string) => void;
}

export function useLandingShortener({
  isAuthenticated,
  onOpenLeadModal,
}: UseLandingShortenerProps) {
  const [destinationUrl, setDestinationUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<LinkDto | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasReachedGuestLimit, setHasReachedGuestLimit] = useState(false);

  // Check if guest link exists in localStorage
  useEffect(() => {
    const savedGuestLink = localStorage.getItem(GUEST_LINK_KEY);
    if (savedGuestLink) {
      try {
        const parsed = JSON.parse(savedGuestLink) as LinkDto;
        setCreatedLink(parsed);
        setHasReachedGuestLimit(true);
      } catch {
        localStorage.removeItem(GUEST_LINK_KEY);
      }
    }
  }, []);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationUrl) return;

    if (!isAuthenticated && hasReachedGuestLimit) {
      onOpenLeadModal();
      return;
    }

    if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
      setError('Please provide a valid web address starting with http or https');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ data: LinkDto }>('/api/v1/links/public', {
        destinationUrl: destinationUrl.trim(),
      });

      const newLink = response.data.data;
      setCreatedLink(newLink);
      setHasReachedGuestLimit(true);
      localStorage.setItem(GUEST_LINK_KEY, JSON.stringify(newLink));
      setDestinationUrl('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        if (err.message.includes('free anonymous limit') || err.message.includes('RATE_LIMITED')) {
          setHasReachedGuestLimit(true);
          onOpenLeadModal();
        }
      } else {
        setError('Failed to shorten link. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!createdLink) return;
    navigator.clipboard.writeText(createdLink.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!createdLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shortened link via URLRef',
          url: createdLink.shortUrl,
        });
      } catch {
        // User dismissed native share dialog
      }
    } else {
      handleCopy();
    }
  };

  const handleShortenAnother = () => {
    if (!isAuthenticated && hasReachedGuestLimit) {
      onOpenLeadModal(
        'Ready to create more links?',
        'URLRef is the right solution for you. Sign up for free now and unlock 10 links each month with dynamic editable QR codes.',
      );
    } else {
      setCreatedLink(null);
      setDestinationUrl('');
      localStorage.removeItem(GUEST_LINK_KEY);
    }
  };

  return {
    destinationUrl,
    setDestinationUrl,
    loading,
    error,
    createdLink,
    setCreatedLink,
    copied,
    hasReachedGuestLimit,
    setHasReachedGuestLimit,
    handleShorten,
    handleCopy,
    handleShare,
    handleShortenAnother,
  };
}
