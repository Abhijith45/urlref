import React, { useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  LinearProgress,
} from '@mui/material';
import { UploadCloud, Download } from 'lucide-react';
import { BulkLinkRowInput } from '@shortener/shared';
import { BulkImportPreviewTable } from './BulkImportPreviewTable';

interface BulkImportFormProps {
  file: File | null;
  parsedRows: BulkLinkRowInput[];
  parseErrors: string[];
  isOverQuota: boolean;
  remainingQuota: number;
  tier?: string;
  isSubmitting: boolean;
  onFileSelect: (file: File) => void;
  onDownloadTemplate: () => void;
  onUpgradeRequired?: () => void;
  onClose: () => void;
}

export const BulkImportForm: React.FC<BulkImportFormProps> = ({
  file,
  parsedRows,
  parseErrors,
  isOverQuota,
  remainingQuota,
  tier,
  isSubmitting,
  onFileSelect,
  onDownloadTemplate,
  onUpgradeRequired,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      onFileSelect(selected);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Upload a CSV containing URLs and optional campaign UTM tags to generate short links in bulk.
        </Typography>
        <Button
          size="small"
          variant="text"
          startIcon={<Download size={14} />}
          onClick={onDownloadTemplate}
          sx={{ textTransform: 'none', fontWeight: 600, color: '#587529' }}
        >
          Download Sample CSV
        </Button>
      </Box>

      <Box
        sx={{
          border: '2px dashed #cbd5e1',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          bgcolor: '#fafafa',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
          '&:hover': { borderColor: '#587529', bgcolor: '#f4f6f0' },
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
        <UploadCloud size={36} color="#587529" style={{ margin: '0 auto 8px' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1C2411' }}>
          {file ? file.name : 'Click or drag a CSV file here'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Supports up to 250 links per batch. Headers: destinationUrl, title, customAlias, utm_source, utm_medium, utm_campaign
        </Typography>
      </Box>

      {parseErrors.length > 0 && (
        <Alert severity="error">
          {parseErrors.map((err) => (
            <div key={`err-${err}`}>{err}</div>
          ))}
        </Alert>
      )}

      {parsedRows.length > 0 && isOverQuota && (
        <Alert
          severity="warning"
          action={
            onUpgradeRequired && (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  onClose();
                  onUpgradeRequired();
                }}
                sx={{ fontWeight: 700, textTransform: 'none' }}
              >
                Upgrade Plan
              </Button>
            )
          }
        >
          This batch has <strong>{parsedRows.length}</strong> links, but you have{' '}
          <strong>{remainingQuota}</strong> links remaining on your {tier || 'current'} plan this month.
        </Alert>
      )}

      <BulkImportPreviewTable rows={parsedRows} />

      {isSubmitting && (
        <Box sx={{ py: 1 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#587529' }}>
            Processing and generating short codes in 25-row chunks...
          </Typography>
          <LinearProgress color="primary" />
        </Box>
      )}
    </>
  );
};
