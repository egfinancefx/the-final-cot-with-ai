import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { SummaryRow, ThemeMode } from '../types';
import { formatCurrency } from '../utils';
import { Activity, Radio, Sparkles } from 'lucide-react';

interface RadarOverviewCardProps {
  summaryData: SummaryRow[];
  themeMode: ThemeMode;
  onSelectAsset?: (asset: string) => void;
  compact?: boolean;
}

const DEFAULT_BENCHMARKS = ['Gold', 'Bitcoin Micro', 'Euro FX'];

export const RadarOverviewCard: React.FC<RadarOverviewCardProps> = ({
  summaryData,
  themeMode,
  onSelectAsset
}) => {
  const [activeCategory, setActiveCategory] = useState<'top' | 'metals' | 'currencies' | 'crypto'>('top');

  const selectedAssets = useMemo(() => {
    if (summaryData.length === 0) return [];
    switch (activeCategory) {
      case 'metals':
        return ['Gold', 'Silver', 'High Grade Copper'].filter(name => summaryData.some(s => s.Commodity === name));
      case 'currencies':
        return ['Euro FX', 'British Pound', 'Japanese Yen'].filter(name => summaryData.some(s => s.Commodity === name));
      case 'crypto':
        return ['Bitcoin Micro', 'Ether Micro'].filter(name => summaryData.some(s => s.Commodity === name));
      case 'top':
      default:
        return DEFAULT_BENCHMARKS.filter(name => summaryData.some(s => s.Commodity === name));
    }
  }, [summaryData, activeCategory]);

  const radarData = useMemo(() => {
    if (summaryData.length === 0 || selectedAssets.length === 0) return [];

    const assetRows = selectedAssets.map(name => summaryData.find(s => s.Commodity === name)).filter(Boolean) as SummaryRow[];
    if (assetRows.length === 0) return [];

    let maxLong = 1;
    let maxShort = 1;
    let maxNet = 1;
    let maxChange = 1;
    let maxTotal = 1;

    summaryData.forEach(row => {
      maxLong = Math.max(maxLong, Math.abs(row["Long Positions"] || 0));
      maxShort = Math.max(maxShort, Math.abs(row["Short Positions"] || 0));
      maxNet = Math.max(maxNet, Math.abs(row["Net Positions"] || 0));
      maxChange = Math.max(maxChange, Math.abs(row["Net Change"] || 0));
      maxTotal = Math.max(maxTotal, Math.abs(row["Long Positions"] || 0) + Math.abs(row["Short Positions"] || 0));
    });

    const metrics = [
      { key: 'longPower', label: 'Long %' },
      { key: 'shortPower', label: 'Short %' },
      { key: 'netIntensity', label: 'Net Density' },
      { key: 'weeklyShift', label: 'Weekly Delta' },
      { key: 'dominance', label: 'Volume Share' },
    ];

    return metrics.map(m => {
      const point: Record<string, any> = { metric: m.label };

      assetRows.forEach(row => {
        const total = (row["Long Positions"] || 0) + (row["Short Positions"] || 0);
        let score = 50;

        if (m.key === 'longPower') {
          score = total > 0 ? ((row["Long Positions"] || 0) / total) * 100 : 50;
        } else if (m.key === 'shortPower') {
          score = total > 0 ? ((row["Short Positions"] || 0) / total) * 100 : 50;
        } else if (m.key === 'netIntensity') {
          score = Math.min(100, (Math.abs(row["Net Positions"] || 0) / maxNet) * 100);
        } else if (m.key === 'weeklyShift') {
          score = Math.min(100, (Math.abs(row["Net Change"] || 0) / maxChange) * 100);
        } else if (m.key === 'dominance') {
          score = Math.min(100, (total / maxTotal) * 100);
        }

        point[row.Commodity] = Math.round(score);
      });

      return point;
    });
  }, [summaryData, selectedAssets]);

  const colors = [
    { stroke: '#3b82f6', fill: '#3b82f6' }, // Blue
    { stroke: '#10b981', fill: '#10b981' }, // Emerald
    { stroke: '#f59e0b', fill: '#f59e0b' }, // Amber
    { stroke: '#8b5cf6', fill: '#8b5cf6' }  // Purple
  ];

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
      <div className="flex items-center justify-between gap-1.5 mb-1.5 pb-2 border-b border-inherit">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${themeMode === 'light' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <h3 className={`text-xs sm:text-sm font-semibold font-heading tracking-tight leading-tight ${textMain}`}>
              Radar Chart
            </h3>
            <p className={`text-[10px] ${textSub}`}>Multi-metric institutional footprint</p>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1">
          {(['top', 'metals', 'currencies'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider transition-colors ${
                activeCategory === cat
                  ? (themeMode === 'light' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-500/30 text-blue-300 border border-blue-500/40')
                  : (themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800')
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Radar Canvas */}
      <div className="flex-1 w-full min-h-[170px] max-h-[195px] flex items-center justify-center relative">
        {radarData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="58%" data={radarData}>
              <PolarGrid stroke={gridStroke} strokeDasharray="3 3" />
              <PolarAngleAxis 
                dataKey="metric" 
                tick={{ fill: axisTickColor, fontSize: 9, fontWeight: 500 }} 
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={false} 
                axisLine={false} 
              />
              {selectedAssets.map((asset, idx) => {
                const c = colors[idx % colors.length];
                return (
                  <Radar
                    key={asset}
                    name={asset}
                    dataKey={asset}
                    stroke={c.stroke}
                    fill={c.fill}
                    fillOpacity={0.22}
                    strokeWidth={2}
                    isAnimationActive={true}
                    animationDuration={900}
                  />
                );
              })}
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)',
                  borderColor: themeMode === 'light' ? '#e2e8f0' : 'rgba(59, 130, 246, 0.3)',
                  borderRadius: '12px',
                  color: themeMode === 'light' ? '#0f172a' : '#f8fafc',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
                formatter={(value) => (
                  <span 
                    onClick={() => onSelectAsset && onSelectAsset(value)}
                    className="cursor-pointer hover:underline"
                    title={`Click to inspect ${value}`}
                  >
                    {value}
                  </span>
                )}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className={`text-xs ${textSub} flex items-center gap-2`}>
            <Activity className="w-4 h-4 animate-spin text-blue-500" />
            Generating Radar Mapping...
          </div>
        )}
      </div>
    </div>
  );
};

export default RadarOverviewCard;
