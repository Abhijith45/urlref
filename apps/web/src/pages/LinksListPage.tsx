import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  TablePagination,
  CircularProgress,
} from '@mui/material';
import { Plus, Search, FileSpreadsheet } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import { queryKeys } from '../services/query-keys';
import { LinkDto } from '@shortener/shared';
import { CreateLinkModal } from '../components/links/CreateLinkModal';
import { BulkImportModal } from '../components/links/BulkImportModal';
import { EditLinkModal } from '../components/links/EditLinkModal';
import { DeleteLinkModal } from '../components/links/DeleteLinkModal';
import { QrCodeModal } from '../components/links/QrCodeModal';
import { BillingModal } from '../components/billing/BillingModal';
import { LinksTable } from '../components/links/LinksTable';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

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
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkDto | null>(null);
  const [deletingLink, setDeletingLink] = useState<LinkDto | null>(null);
  const [qrLink, setQrLink] = useState<LinkDto | null>(null);
  const [isBillingOpen, setIsBillingOpen] = useState(false);

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
    toast.success('Link copied to clipboard!');
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
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            disableElevation
            disableRipple
            startIcon={<FileSpreadsheet size={18} />}
            onClick={() => setIsBulkOpen(true)}
            sx={{ px: 2.5, py: 1, textTransform: 'none', fontWeight: 600 }}
          >
            Bulk Import (CSV)
          </Button>
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
              <LinksTable
                links={data.data}
                copiedId={copiedId}
                onCopy={handleCopy}
                onViewAnalytics={(id) => navigate(`/dashboard/analytics/${id}`)}
                onOpenQr={(link) => setQrLink(link)}
                onEdit={(link) => setEditingLink(link)}
                onDelete={(link) => setDeletingLink(link)}
              />

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
        onUpgradeRequired={() => setIsBillingOpen(true)}
      />
      <BulkImportModal
        open={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onSuccess={handleRefetch}
        onUpgradeRequired={() => setIsBillingOpen(true)}
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
      <BillingModal
        open={isBillingOpen}
        onClose={() => setIsBillingOpen(false)}
        onRefresh={() => {
          queryClient.invalidateQueries({ queryKey: ['billing', 'subscription'] });
          handleRefetch();
        }}
      />
    </Box>
  );
};
