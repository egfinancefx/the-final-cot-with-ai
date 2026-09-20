import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  Cell
} from 'recharts';
import { SummaryRow, ThemeMode } from '../types';
import { formatCurrency } from '../utils';
import { BarChart3, TrendingUp, Layers, ArrowUpDown } from 'lucide-react';

interface BarRoundedChartCardProps {
  summaryData: SummaryRow[];
  themeMode: ThemeMode;
  onSelectAsset?: (asset: string) => void;
}

export const BarRoundedChartCard: React.FC<BarRoundedChartCardProps> = ({
  summaryData,
  themeMode,
  onSelectAsset
}) => {
  const [metricMode, setMetricMode] = useState<'net' | 'longShort' | 'flow'>('net');

  // Curated list of top prominent assets to compare
  const chartData = useMemo(() => {
    if (!summaryData || summaryData.length === 0) return [];

    // Sort by absolute net positions or top assets
    const sorted = [...summaryData]
      .filter(row => row.Commodity && (row["Long Positions"] || row["Short Positions"]))
      .sort((a, b) => {
        if (metricMode === 'flow') {
          return Math.abs(b["Net Change"] || 0) - Math.abs(a["Net Change"] || 0);
        }
        return Math.abs(b["Net Positions"] || 0) - Math.abs(a["Net Positions"] || 0);
      })
      .slice(0, 8);

    return sorted.map(row => {
      // Shorten name for clean X-axis display
      let shortName = row.Commodity;
      if (shortName.length > 12) {
        shortName = shortName
          .replace('Futures Mini', 'Mini')
          .replace('Micro', 'Mic')
          .replace('Index', 'Idx')
          .replace('High Grade ', '')
          .replace('Crude Oil ', '')
          .replace('Harbor', '');
      }

      return {
        fullName: row.Commodity,
        name: shortName,
        net: row["Net Positions"] || 0,
        long: row["Long Positions"] || 0,
        short: row["Short Positions"] || 0,
        flow: row["Net Change"] || 0
      };
    });
  }, [summaryData, metricMode]);

  const cardBg = themeMode === 'light' 
    ? 'bg-white border-slate-200 shadow-xl' 
    : 'bg-slate-900/80 border-blue-500/10 shadow-2xl backdrop-blur-md';

  const textMain = themeMode === 'light' ? 'text-slate-900' : 'text-white';
  const textSub = themeMode === 'light' ? 'text-slate-500' : 'text-slate-400';
  const gridStroke = themeMode === 'light' ? '#e2e8f0' : '#1e293b';
  const axisTickColor = themeMode === 'light' ? '#64748b' : '#94a3b8';

  return (
    <div className={`rounded-xl sm:rounded-2xl border p-3 sm:p-3.5 flex flex-col h-full transition-all duration-300 ${cardBg}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5 pb-2 border-b border-inherit">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${themeMode === 'light' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
            <BarChart3 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className={`text-xs sm:text-sm font-semibold font-heading tracking-tight leading-tight ${textMain}`}>
              Bar Rounded Chart
            </h3>
            <p className={`text-[10px] ${textSub}`}>Institutional contracts & position divergence</p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMetricMode('net')}
            className={`px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider transition-colors ${
              metricMode === 'net'
                ? (themeMode === 'light' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-500/30 text-blue-300 border border-blue-500/40')
                : (themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800')
            }`}
          >
            Net Position
          </button>
          <button
            onClick={() => setMetricMode('longShort')}
            className={`px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider transition-colors ${
              metricMode === 'longShort'
                ? (themeMode === 'light' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-500/30 text-blue-300 border border-blue-500/40')
                : (themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800')
            }`}
          >
            Long vs Short
          </button>
          <button
            onClick={() => setMetricMode('flow')}
            className={`px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider transition-colors ${
              metricMode === 'flow'
                ? (themeMode === 'light' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-500/30 text-blue-300 border border-blue-500/40')
                : (themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800')
            }`}
          >
            Weekly Shift
          </button>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="flex-1 w-full min-h-[160px] max-h-[195px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 8, right: 6, left: -14, bottom: 2 }}
              barGap={3}
            >
              <CartesianGrid vertical={false} stroke={gridStroke} strokeDasharray="3 3" opacity={0.6} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: axisTickColor, fontSize: 10 }} 
                axisLine={{ stroke: gridStroke }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: axisTickColor, fontSize: 9 }} 
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => {
                  if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(0)}k`;
                  return val;
                }}
              />
              <ReferenceLine y={0} stroke={gridStroke} strokeWidth={1.5} />
              <RechartsTooltip
                formatter={(val: any, name: any) => [formatCurrency(Number(val)) + ' contracts', name]}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload;
                  return item ? item.fullName : label;
                }}
                contentStyle={{
                  backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)',
                  borderColor: themeMode === 'light' ? '#e2e8f0' : 'rgba(59, 130, 246, 0.3)',
                  borderRadius: '12px',
                  color: themeMode === 'light' ? '#0f172a' : '#f8fafc',
                  fontSize: '11px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                }}
              />

              {metricMode === 'net' && (
                <Bar 
                  dataKey="net" 
                  name="Net Position"
                  radius={[4, 4, 4, 4]}
                  animationDuration={800}
                  onClick={(entry: any) => {
                    const name = entry?.payload?.fullName || entry?.fullName;
                    if (name && onSelectAsset) onSelectAsset(name);
                  }}
                  className="cursor-pointer"
                >
                  {chartData.map((entry, index) => {
                    const isPositive = entry.net >= 0;
                    const fillColor = isPositive 
                      ? (themeMode === 'light' ? '#2563eb' : '#3b82f6')
                      : (themeMode === 'light' ? '#94a3b8' : '#64748b');
                    return <Cell key={`cell-${index}`} fill={fillColor} />;
                  })}
                </Bar>
              )}

              {metricMode === 'longShort' && (
                <>
                  <Bar 
                    dataKey="long" 
                    name="Longs" 
                    fill="#3b82f6" 
                    radius={[6, 6, 0, 0]} 
                    animationDuration={800}
                    onClick={(entry: any) => {
                      const name = entry?.payload?.fullName || entry?.fullName;
                      if (name && onSelectAsset) onSelectAsset(name);
                    }}
                    className="cursor-pointer"
                  />
                  <Bar 
                    dataKey="short" 
                    name="Shorts" 
                    fill={themeMode === 'light' ? '#94a3b8' : '#64748b'} 
                    radius={[6, 6, 0, 0]} 
                    animationDuration={800}
                    onClick={(entry: any) => {
                      const name = entry?.payload?.fullName || entry?.fullName;
                      if (name && onSelectAsset) onSelectAsset(name);
                    }}
                    className="cursor-pointer"
                  />
                </>
              )}

              {metricMode === 'flow' && (
                <Bar 
                  dataKey="flow" 
                  name="Weekly Shift"
                  radius={[6, 6, 6, 6]}
                  animationDuration={800}
                  onClick={(entry: any) => {
                    const name = entry?.payload?.fullName || entry?.fullName;
                    if (name && onSelectAsset) onSelectAsset(name);
                  }}
                  className="cursor-pointer"
                >
                  {chartData.map((entry, index) => {
                    const isPositive = entry.flow >= 0;
                    const fillColor = isPositive ? '#10b981' : '#f43f5e';
                    return <Cell key={`flow-${index}`} fill={fillColor} />;
                  })}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className={`h-full flex items-center justify-center text-xs ${textSub}`}>
            Loading Bar Chart...
          </div>
        )}
      </div>
    </div>
  );
};

export default BarRoundedChartCard;
