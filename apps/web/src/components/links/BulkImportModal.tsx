import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
  IconButton,
} from '@mui/material';
import { FileSpreadsheet, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiError } from '../../services/api-client';
import { BulkLinkRowInput, BulkImportResultDto } from '@shortener/shared';
import {
  parseBulkCsvContent,
  generateSampleCsvTemplate,
  generateBulkResultsCsv,
  downloadCsvBlob,
} from './bulk-csv-parser';
import { BulkImportSummary } from './BulkImportSummary';
import { BulkImportForm } from './BulkImportForm';

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onUpgradeRequired?: () => void;
}

interface QuotaResponse {
  used: number;
  total: number;
  tier: string;
  resetAt: string;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  open,
  onClose,
  onSuccess,
  onUpgradeRequired,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<BulkLinkRowInput[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResultDto | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const { data: quota } = useQuery<QuotaResponse>({
    queryKey: ['links', 'quota'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: QuotaResponse }>('/api/v1/links/quota');
      return res.data.data;
    },
    enabled: open,
  });

  const remainingQuota = quota ? Math.max(0, quota.total - quota.used) : 1000;
  const isOverQuota = parsedRows.length > remainingQuota;

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setParseErrors([]);
    setImportResult(null);
    setGeneralError(null);
    setIsSubmitting(false);
  };

  const handleModalClose = () => {
    if (isSubmitting) return;
    handleReset();
    onClose();
  };

  const handleFileSelect = (selected: File) => {
    setFile(selected);
    setGeneralError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const { rows, errors } = parseBulkCsvContent(text);
      setParsedRows(rows);
      setParseErrors(errors);
    };
    reader.onerror = () => {
      setParseErrors(['Failed to read selected CSV file.']);
    };
    reader.readAsText(selected);
  };

  const handleDownloadTemplate = () => {
    const template = generateSampleCsvTemplate();
    downloadCsvBlob(template, 'urlref_bulk_template.csv');
  };

  const handleDownloadResults = () => {
    if (!importResult) return;
    const csv = generateBulkResultsCsv(importResult.results);
    downloadCsvBlob(csv, 'urlref_bulk_results.csv');
  };

  const handleSubmitImport = async () => {
    if (parsedRows.length === 0 || isOverQuota) return;
    setIsSubmitting(true);
    setGeneralError(null);

    try {
      const res = await apiClient.post<{ data: BulkImportResultDto }>('/api/v1/links/bulk', {
        rows: parsedRows,
      });
      setImportResult(res.data.data);
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setGeneralError(err.message);
      } else if (err instanceof Error) {
        setGeneralError(err.message);
      } else {
        setGeneralError('Batch import failed. Please verify your CSV.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleModalClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FileSpreadsheet size={22} color="#587529" />
          <span>Bulk URL Shortener & Dynamic QR Engine</span>
        </Box>
        <IconButton size="small" onClick={handleModalClose} disabled={isSubmitting}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
        {generalError && <Alert severity="error">{generalError}</Alert>}

        {importResult ? (
          <BulkImportSummary importResult={importResult} onDownloadResults={handleDownloadResults} />
        ) : (
          <BulkImportForm
            file={file}
            parsedRows={parsedRows}
            parseErrors={parseErrors}
            isOverQuota={isOverQuota}
            remainingQuota={remainingQuota}
            tier={quota?.tier}
            isSubmitting={isSubmitting}
            onFileSelect={handleFileSelect}
            onDownloadTemplate={handleDownloadTemplate}
            onUpgradeRequired={onUpgradeRequired}
            onClose={handleModalClose}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {importResult ? (
          <Button
            variant="contained"
            disableElevation
            disableRipple
            onClick={handleModalClose}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Done
          </Button>
        ) : (
          <>
            <Button
              onClick={handleModalClose}
              disabled={isSubmitting}
              color="inherit"
              disableElevation
              disableRipple
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disableElevation
              disableRipple
              disabled={isSubmitting || parsedRows.length === 0 || isOverQuota}
              onClick={handleSubmitImport}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              {isSubmitting ? 'Importing...' : `Import ${parsedRows.length || ''} Links`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
