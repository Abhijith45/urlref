import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { BulkImportResultDto } from '@shortener/shared';

interface BulkImportSummaryProps {
  importResult: BulkImportResultDto;
  onDownloadResults: () => void;
}

export const BulkImportSummary: React.FC<BulkImportSummaryProps> = ({
  importResult,
  onDownloadResults,
}) => {
  const isAllSuccess = importResult.failureCount === 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
      <Box
        sx={{
          p: 3,
          borderRadius: 1.5,
          bgcolor: isAllSuccess ? 'rgba(88, 117, 41, 0.08)' : 'rgba(234, 88, 12, 0.08)',
          border: '1px solid',
          borderColor: isAllSuccess ? '#587529' : '#ea580c',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {isAllSuccess ? (
          <CheckCircle2 size={36} color="#587529" />
        ) : (
          <AlertTriangle size={36} color="#ea580c" />
        )}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1C2411' }}>
            Bulk Import Completed
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Successfully created <strong>{importResult.successCount}</strong> short links and dynamic QRs.
            {importResult.failureCount > 0 && ` (${importResult.failureCount} rows failed)`}
          </Typography>
        </Box>
      </Box>

      {importResult.failureCount > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#b91c1c' }}>
            Failed Rows:
          </Typography>
          <Box
            sx={{
              maxHeight: 180,
              overflowY: 'auto',
              border: '1px solid #fee2e2',
              borderRadius: 1,
              p: 1.5,
              bgcolor: '#fff5f5',
              fontSize: '0.8rem',
            }}
          >
            {importResult.results
              .filter((r) => r.status !== 'success')
              .map((r) => (
                <Box key={`failed-row-${r.rowNumber}`} sx={{ mb: 1 }}>
                  <strong>Row {r.rowNumber}:</strong> {r.destinationUrl} &mdash;{' '}
                  <span style={{ color: '#dc2626' }}>{r.error}</span>
                </Box>
              ))}
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2, pt: 1 }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<Download size={16} />}
          onClick={onDownloadResults}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Download Results CSV
        </Button>
      </Box>
    </Box>
  );
};
