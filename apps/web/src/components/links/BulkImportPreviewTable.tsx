import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { FileText } from 'lucide-react';
import { BulkLinkRowInput } from '@shortener/shared';

interface BulkImportPreviewTableProps {
  rows: BulkLinkRowInput[];
}

export const BulkImportPreviewTable: React.FC<BulkImportPreviewTableProps> = ({ rows }) => {
  if (rows.length === 0) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <FileText size={16} />
          Preview (First {Math.min(5, rows.length)} of {rows.length} rows)
        </Typography>
        <Chip
          size="small"
          label={`${rows.length} rows detected`}
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E4E9DC', maxHeight: 240 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F4F6F0' }}>
              <TableCell sx={{ fontWeight: 700 }}>Destination URL</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Alias</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>UTM Campaign</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(0, 5).map((row) => (
              <TableRow key={`${row.destinationUrl}-${row.title || ''}-${row.customAlias || ''}-${row.utmCampaign || ''}`}>
                <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.destinationUrl}
                </TableCell>
                <TableCell>{row.title || '—'}</TableCell>
                <TableCell>{row.customAlias || '—'}</TableCell>
                <TableCell>{row.utmCampaign || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
