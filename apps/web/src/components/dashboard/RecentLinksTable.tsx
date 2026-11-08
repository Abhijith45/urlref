import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material';
import { Copy, Check, BarChart2, ArrowRight, ExternalLink } from 'lucide-react';
import { LinkDto } from '@shortener/shared';
import { useNavigate } from 'react-router-dom';

interface RecentLinksTableProps {
  links: LinkDto[];
  isLoading: boolean;
  copiedId: string | null;
  onCopy: (link: LinkDto) => void;
}

export const RecentLinksTable: React.FC<RecentLinksTableProps> = ({
  links,
  isLoading,
  copiedId,
  onCopy,
}) => {
  const navigate = useNavigate();

  return (
    <Card sx={{ border: '1px solid #E4E9DC', boxShadow: 'none' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1C2411' }}>
            Recent short links
          </Typography>
          <Button
            size="small"
            color="primary"
            disableRipple
            disableElevation
            endIcon={<ArrowRight size={16} />}
            onClick={() => navigate('/dashboard/links')}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            View all links
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : links.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              You haven't generated any short links yet.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E4E9DC', maxWidth: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 580 }}>
              <TableHead sx={{ bgcolor: '#FBFBFA' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Short link</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Destination URL</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total clicks</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          /{link.code}
                        </Typography>
                        <Tooltip title={copiedId === link.id ? 'Copied!' : 'Copy short link'}>
                          <IconButton size="small" onClick={() => onCopy(link)} aria-label="Copy short link">
                            {copiedId === link.id ? <Check size={14} color="#71951E" /> : <Copy size={14} />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {link.destinationUrl}
                        </span>
                        <a
                          href={link.destinationUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open destination URL ${link.destinationUrl}`}
                          style={{ color: '#64748b', display: 'flex' }}
                        >
                          <ExternalLink size={12} />
                        </a>
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${link.totalClicks ?? 0} clicks`}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={link.isActive ? 'Active' : 'Disabled'}
                        size="small"
                        color={link.isActive ? 'success' : 'default'}
                        sx={{ fontSize: '0.75rem', fontWeight: 600, height: 20 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Link Analytics">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/dashboard/links/${link.id}/analytics`)}
                          aria-label="View analytics"
                        >
                          <BarChart2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};
