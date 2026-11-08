import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Paper,
} from '@mui/material';

export interface AnalyticsMetricRow {
  key: string;
  label: string;
  clicks: number;
}

interface AnalyticsCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ icon, title, children }) => (
  <Card sx={{ height: '100%', p: 1, border: '1px solid #E4E9DC', borderRadius: 1.25, boxShadow: 'none' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1C2411' }}>
          {title}
        </Typography>
      </Box>
      {children}
    </CardContent>
  </Card>
);

interface AnalyticsMetricsTableProps {
  columnHeader: string;
  rows: AnalyticsMetricRow[];
}

export const AnalyticsMetricsTable: React.FC<AnalyticsMetricsTableProps> = ({ columnHeader, rows }) => (
  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E4E9DC' }}>
    <Table size="small">
      <TableHead sx={{ bgcolor: 'background.default' }}>
        <TableRow>
          <TableCell sx={{ fontWeight: 700 }}>{columnHeader}</TableCell>
          <TableCell align="right" sx={{ fontWeight: 700 }}>
            Clicks
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell sx={{ fontWeight: 600 }}>{row.label}</TableCell>
            <TableCell align="right">
              <Chip
                label={row.clicks}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600, fontFamily: 'Geist Mono, monospace' }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

interface AnalyticsMetricsCardProps {
  icon: React.ReactNode;
  title: string;
  columnHeader: string;
  rows?: AnalyticsMetricRow[];
  emptyMessage: string;
}

export const AnalyticsMetricsCard: React.FC<AnalyticsMetricsCardProps> = ({
  icon,
  title,
  columnHeader,
  rows,
  emptyMessage,
}) => (
  <AnalyticsCard icon={icon} title={title}>
    {rows && rows.length > 0 ? (
      <AnalyticsMetricsTable columnHeader={columnHeader} rows={rows} />
    ) : (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {emptyMessage}
        </Typography>
      </Box>
    )}
  </AnalyticsCard>
);
