import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TablePagination,
  CircularProgress,
} from '@mui/material';
import {
  Plus,
  Search,
  Copy,
  Check,
  QrCode,
  Edit2,
  Trash2,
  BarChart2,
  ExternalLink,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import { queryKeys } from '../services/query-keys';
import { LinkDto } from '@shortener/shared';
import { CreateLinkModal } from '../components/links/CreateLinkModal';
import { EditLinkModal } from '../components/links/EditLinkModal';
import { DeleteLinkModal } from '../components/links/DeleteLinkModal';
import { QrCodeModal } from '../components/links/QrCodeModal';
import { useNavigate } from 'react-router-dom';

export const LinksListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = 'My Links — URLRef Softics';
  }, []);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkDto | null>(null);
  const [deletingLink, setDeletingLink] = useState<LinkDto | null>(null);
  const [qrLink, setQrLink] = useState<LinkDto | null>(null);

  // Fetch paginated links
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.links.list({
      page: page + 1,
      limit: rowsPerPage,
      search: search || undefined,
    }),
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
      });
      if (search) queryParams.set('search', search);

      const res = await apiClient.get<{
        data: LinkDto[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>(`/api/v1/links?${queryParams.toString()}`);
      return res.data;
    },
  });

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRefetch = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.links.all });
  };

  const total = data?.meta?.total || 0;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            My Links
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Manage, customize, and track performance of all your shortened URLs.
          </Typography>
        </Box>
        <Button
          variant="contained"
          disableElevation
          disableRipple
          startIcon={<Plus size={18} />}
          onClick={() => setIsCreateOpen(true)}
          sx={{ px: 3, py: 1, textTransform: 'none', fontWeight: 700 }}
        >
          Create short link
        </Button>
      </Box>

      <Card sx={{ p: 1 }}>
        <CardContent>
          {/* Search Bar */}
          <Box sx={{ mb: 3 }}>
            <TextField
              placeholder="Search by code, alias, title, or destination..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              size="small"
              sx={{ maxWidth: 450, width: '100%' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} color="#64748b" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : !data?.data || data.data.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                {search ? 'No links found matching your search.' : 'You have not created any short links yet.'}
              </Typography>
              {!search && (
                <Button
                  variant="outlined"
                  disableElevation
                  disableRipple
                  startIcon={<Plus size={16} />}
                  onClick={() => setIsCreateOpen(true)}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Create your first link
                </Button>
              )}
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E4E9DC' }}>
                <Table size="medium">
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
                    {data.data.map((link) => (
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
                                onClick={() => handleCopy(link.id, link.shortUrl)}
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
                                onClick={() => navigate(`/dashboard/analytics/${link.id}`)}
                                sx={{ color: 'primary.main' }}
                              >
                                <BarChart2 size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="QR code">
                              <IconButton size="small" disableRipple onClick={() => setQrLink(link)}>
                                <QrCode size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit link">
                              <IconButton size="small" disableRipple onClick={() => setEditingLink(link)}>
                                <Edit2 size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                disableRipple
                                onClick={() => setDeletingLink(link)}
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

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateLinkModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleRefetch}
      />
      <EditLinkModal
        open={Boolean(editingLink)}
        link={editingLink}
        onClose={() => setEditingLink(null)}
        onSuccess={handleRefetch}
      />
      <DeleteLinkModal
        open={Boolean(deletingLink)}
        link={deletingLink}
        onClose={() => setDeletingLink(null)}
        onSuccess={handleRefetch}
      />
      <QrCodeModal open={Boolean(qrLink)} link={qrLink} onClose={() => setQrLink(null)} />
    </Box>
  );
};
