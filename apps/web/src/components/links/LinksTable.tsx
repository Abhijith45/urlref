import React from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Box,
  Typography,
  Tooltip,
  IconButton,
  Chip,
} from '@mui/material';
import { Copy, Check, ExternalLink, BarChart2, QrCode, Edit2, Trash2 } from 'lucide-react';
import { LinkDto } from '@shortener/shared';

interface LinksTableProps {
  links: LinkDto[];
  copiedId: string | null;
  onCopy: (id: string, url: string) => void;
  onViewAnalytics: (id: string) => void;
  onOpenQr: (link: LinkDto) => void;
  onEdit: (link: LinkDto) => void;
  onDelete: (link: LinkDto) => void;
}

export const LinksTable: React.FC<LinksTableProps> = ({
  links,
  copiedId,
  onCopy,
  onViewAnalytics,
  onOpenQr,
  onEdit,
  onDelete,
}) => {
  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E4E9DC', maxWidth: '100%', overflowX: 'auto' }}>
      <Table size="medium" sx={{ minWidth: 650 }}>
        <TableHead sx={{ bgcolor: 'background.default' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Short link</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Destination URL</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Clicks</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {links.map((link) => (
            <TableRow key={link.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: 'primary.main', display: 'block', fontFamily: 'Geist Mono, monospace' }}
                    >
                      {link.customDomain ? `${link.customDomain.hostname}/${link.code}` : `/${link.code}`}
                    </Typography>
                    {link.title && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        {link.title}
                      </Typography>
                    )}
                  </Box>
                  <Tooltip title={copiedId === link.id ? 'Copied!' : 'Copy Short Link'}>
                    <IconButton
                      size="small"
                      disableRipple
                      onClick={() => onCopy(link.id, link.shortUrl)}
                    >
                      {copiedId === link.id ? (
                        <Check size={14} color="#71951E" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell sx={{ maxWidth: 280 }}>
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
                  sx={{ fontSize: '0.75rem', height: 22 }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {new Date(link.createdAt).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                  <Tooltip title="View analytics">
                    <IconButton
                      size="small"
                      disableRipple
                      onClick={() => onViewAnalytics(link.id)}
                      sx={{ color: 'primary.main' }}
                    >
                      <BarChart2 size={16} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="QR code">
                    <IconButton size="small" disableRipple onClick={() => onOpenQr(link)}>
                      <QrCode size={16} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit link">
                    <IconButton size="small" disableRipple onClick={() => onEdit(link)}>
                      <Edit2 size={16} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      disableRipple
                      onClick={() => onDelete(link)}
                      sx={{ color: 'error.main' }}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
