import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

type RechartsModule = typeof import('recharts');

let rechartsPromise: Promise<RechartsModule> | null = null;
function getRecharts(): Promise<RechartsModule> {
  if (!rechartsPromise) {
    rechartsPromise = import('recharts');
  }
  return rechartsPromise;
}

const PIE_COLORS = ['#587529', '#71951E', '#EDDA5E', '#CBD5E1'];

export interface ClicksSeriesItem {
  date: string;
  clicks: number;
}

export interface DeviceShareItem {
  name: string;
  value: number;
}

const EMPTY_SERIES: ClicksSeriesItem[] = [];
const EMPTY_DATA: DeviceShareItem[] = [];

export const ClicksAreaChart: React.FC<{
  series?: ClicksSeriesItem[];
  emptyMessage?: string;
  height?: number;
}> = ({
  series = EMPTY_SERIES,
  emptyMessage = 'No clicks recorded yet.',
  height = 300,
}) => {
  const [mod, setMod] = useState<RechartsModule | null>(null);

  useEffect(() => {
    let active = true;
    getRecharts().then((loaded) => {
      if (active) setMod(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!series || series.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  if (!mod) {
    return (
      <Box sx={{ width: '100%', height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={24} color="inherit" />
      </Box>
    );
  }

  const { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip: RechartsTooltip } = mod;

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#587529" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#587529" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E9DC" />
          <XAxis dataKey="date" stroke="#556345" fontSize={12} tickLine={false} />
          <YAxis stroke="#556345" fontSize={12} allowDecimals={false} tickLine={false} />
          <RechartsTooltip />
          <Area
            type="monotone"
            dataKey="clicks"
            stroke="#587529"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorClicks)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export const DevicePieChart: React.FC<{
  data?: DeviceShareItem[];
  emptyMessage?: string;
  height?: number;
}> = ({
  data = EMPTY_DATA,
  emptyMessage = 'No device data recorded yet.',
  height = 260,
}) => {
  const [mod, setMod] = useState<RechartsModule | null>(null);

  useEffect(() => {
    let active = true;
    getRecharts().then((loaded) => {
      if (active) setMod(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  if (!mod) {
    return (
      <Box sx={{ width: '100%', height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={24} color="inherit" />
      </Box>
    );
  }

  const { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip: RechartsTooltip } = mod;

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};
