import React, { useMemo, useState } from 'react';
import { SummaryRow, ThemeMode } from '../types';
import { formatCurrency } from '../utils';
import { ASSET_GROUPS } from '../constants';
import { Radar as RadarIcon, Compass } from 'lucide-react';
import { RadarChart } from './charts/radar-chart';
import { RadarGrid } from './charts/radar-grid';
import { RadarAxis } from './charts/radar-axis';
import { RadarLabels } from './charts/radar-labels';
import { RadarArea } from './charts/radar-area';
import { RadarData, RadarMetric } from './charts/radar-context';

export interface RingChartCardProps {
  summaryData: SummaryRow[];
  themeMode: ThemeMode;
}

export const RadarChartCard: React.FC<RingChartCardProps> = ({
  summaryData,
  themeMode
}) => {
  const [viewMode, setViewMode] = useState<'sentiment' | 'sectors'>('sentiment');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 1. Overall Market Sentiment Data Calculations
  const {
    totalLong,
    totalShort,
    totalContracts,
    longPct,
    shortPct,
    sectorMetricsMap
  } = useMemo(() => {
    let tLong = 0;
    let tShort = 0;

    const sectorMap: Record<string, { long: number; short: number; total: number; count: number; net: number }> = {};
    ASSET_GROUPS.forEach(g => {
      sectorMap[g.name] = { long: 0, short: 0, total: 0, count: 0, net: 0 };
    });

    if (summaryData && summaryData.length > 0) {
      summaryData.forEach(row => {
        const l = row["Long Positions"] || 0;
        const s = row["Short Positions"] || 0;
        const net = row["Net Positions"] || 0;
        tLong += l;
        tShort += s;

        // Associate with group
        for (const g of ASSET_GROUPS) {
          if (g.items.includes(row.Commodity)) {
            sectorMap[g.name].long += l;
            sectorMap[g.name].short += s;
            sectorMap[g.name].total += (l + s);
            sectorMap[g.name].net += net;
            sectorMap[g.name].count += 1;
            break;
          }
        }
      });
    } else {
      tLong = 65000;
      tShort = 35000;
    }

    const tContracts = tLong + tShort;
    const lPct = tContracts > 0 ? (tLong / tContracts) * 100 : 65;
    const sPct = 100 - lPct;

    return {
      totalLong: tLong,
      totalShort: tShort,
      totalContracts: tContracts,
      longPct: lPct,
      shortPct: sPct,
      sectorMetricsMap: sectorMap
    };
  }, [summaryData]);

  // 2. Metrics & Series Data for Sentiment View in Dark Blue Shades
  const sentimentRadarConfig = useMemo(() => {
    const metrics: RadarMetric[] = [
      { key: 'currencies', label: 'Currencies' },
      { key: 'metals', label: 'Metals' },
      { key: 'indices', label: 'Indices' },
      { key: 'energy', label: 'Energy' },
      { key: 'crypto', label: 'Crypto' },
    ];

    // Rich Dark Blue and Royal Navy Tones
    const longColor = themeMode === 'light' ? '#1e40af' : '#2563eb'; // Royal Dark Blue
    const shortColor = themeMode === 'light' ? '#172554' : '#1d4ed8'; // Midnight Navy Blue

    const longValues: Record<string, number> = {};
    const shortValues: Record<string, number> = {};

    metrics.forEach(m => {
      const groupName = m.label;
      const data = sectorMetricsMap[groupName];
      if (data && data.total > 0) {
        longValues[m.key] = Math.round((data.long / data.total) * 100);
        shortValues[m.key] = Math.round((data.short / data.total) * 100);
      } else {
        longValues[m.key] = 60;
        shortValues[m.key] = 40;
      }
    });

    const seriesData: RadarData[] = [
      {
        label: 'Long Positions',
        color: longColor,
        values: longValues
      },
      {
        label: 'Short Positions',
        color: shortColor,
        values: shortValues
      }
    ];

    return { metrics, seriesData };
  }, [sectorMetricsMap, themeMode]);

  // 3. Metrics & Series Data for Sectors View in Harmonious Dark Blue Shades
  const sectorsRadarConfig = useMemo(() => {
    const metrics: RadarMetric[] = [
      { key: 'volume', label: 'Volume %' },
      { key: 'longRatio', label: 'Long %' },
      { key: 'netBias', label: 'Net Bias' },
      { key: 'breadth', label: 'Breadth' },
      { key: 'activity', label: 'Activity' },
    ];

    // Dark blue gradient palette for sectors
    const sectorColors: Record<string, string> = {
      'Currencies': themeMode === 'light' ? '#1e40af' : '#3b82f6', // Bright Navy
      'Metals': themeMode === 'light' ? '#1d4ed8' : '#2563eb',     // Royal Blue
      'Indices': themeMode === 'light' ? '#1e3a8a' : '#60a5fa',    // Steel Blue
      'Energy': themeMode === 'light' ? '#172554' : '#1d4ed8',     // Deep Midnight
      'Crypto': themeMode === 'light' ? '#312e81' : '#4338ca'      // Indigo Navy
    };

    let maxVolume = 1;
    let maxNetAbs = 1;
    ASSET_GROUPS.forEach(g => {
      const stats = sectorMetricsMap[g.name];
      if (stats) {
        maxVolume = Math.max(maxVolume, stats.total);
        maxNetAbs = Math.max(maxNetAbs, Math.abs(stats.net));
      }
    });

    const seriesData: RadarData[] = ASSET_GROUPS.map(group => {
      const stats = sectorMetricsMap[group.name] || { long: 0, short: 0, total: 0, count: 0, net: 0 };
      const volShare = totalContracts > 0 ? (stats.total / totalContracts) * 100 : 20;
      const lRatio = stats.total > 0 ? (stats.long / stats.total) * 100 : 50;
      const netScore = Math.min(100, Math.round((Math.abs(stats.net) / maxNetAbs) * 100));
      const breadthScore = Math.min(100, Math.round((stats.count / 4) * 100));
      const activityScore = Math.min(100, Math.round((stats.total / maxVolume) * 100));

      return {
        label: group.name,
        color: sectorColors[group.name] || '#2563eb',
        values: {
          volume: Math.round(volShare * 2.5),
          longRatio: Math.round(lRatio),
          netBias: netScore,
          breadth: breadthScore || 30,
          activity: activityScore || 25
        }
      };
    });

    return { metrics, seriesData };
  }, [sectorMetricsMap, totalContracts, themeMode]);

  const activeConfig = viewMode === 'sentiment' ? sentimentRadarConfig : sectorsRadarConfig;

  // Dark Blue Shades Card Background
  const cardBg = themeMode === 'light' 
    ? 'bg-slate-50 border-blue-900/20 shadow-xl' 
    : 'bg-[#080f20] border-blue-900/60 shadow-2xl shadow-blue-950/80 backdrop-blur-md';

  const textMain = themeMode === 'light' ? 'text-blue-950' : 'text-blue-100';
  const textSub = themeMode === 'light' ? 'text-blue-800/70' : 'text-blue-300/70';

  return (
    <div 
      className={`rounded-xl sm:rounded-2xl border p-3 sm:p-3.5 flex flex-col h-full transition-all duration-300 ${cardBg}`}
      style={{
        '--chart-label': themeMode === 'light' ? '#1e3a8a' : '#60a5fa',
        '--border': themeMode === 'light' ? 'rgba(30, 58, 138, 0.25)' : 'rgba(30, 64, 175, 0.45)',
        '--chart-background': themeMode === 'light' ? '#ffffff' : '#080f20',
        '--chart-foreground': themeMode === 'light' ? '#0f172a' : '#f1f5f9',
        '--chart-foreground-muted': themeMode === 'light' ? '#1e40af' : '#93c5fd',
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-1.5 mb-1 pb-2 border-b border-blue-900/30">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border shrink-0 ${themeMode === 'light' ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-blue-950/80 text-blue-300 border-blue-800/50'}`}>
            <RadarIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className={`text-xs sm:text-sm font-semibold font-heading tracking-tight leading-tight ${textMain}`}>
                Radar Chart
              </h3>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium ${
                themeMode === 'light' 
                  ? 'bg-blue-100 text-blue-900 border border-blue-300' 
                  : 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
              }`}>
                {longPct.toFixed(1)}% Bullish
              </span>
            </div>
            <p className={`text-[10px] ${textSub}`}>Market sentiment & sector allocation</p>
          </div>
        </div>

        {/* View Switcher in Dark Blue */}
        <div className="flex items-center gap-1 bg-blue-950/80 p-0.5 rounded-lg border border-blue-900/60 shrink-0">
          <button
            onClick={() => {
              setViewMode('sentiment');
              setHoveredIndex(null);
            }}
            className={`px-2 py-0.5 rounded text-[9px] font-medium transition-all ${
              viewMode === 'sentiment'
                ? (themeMode === 'light' ? 'bg-blue-800 text-white shadow-sm font-semibold' : 'bg-blue-600 text-white font-semibold shadow-md border border-blue-500')
                : 'text-blue-300/70 hover:text-white'
            }`}
          >
            Sentiment
          </button>
          <button
            onClick={() => {
              setViewMode('sectors');
              setHoveredIndex(null);
            }}
            className={`px-2 py-0.5 rounded text-[9px] font-medium transition-all ${
              viewMode === 'sectors'
                ? (themeMode === 'light' ? 'bg-blue-800 text-white shadow-sm font-semibold' : 'bg-blue-600 text-white font-semibold shadow-md border border-blue-500')
                : 'text-blue-300/70 hover:text-white'
            }`}
          >
            Sectors
          </button>
        </div>
      </div>

      {/* Radar Chart Visual Centerpiece */}
      <div className="flex-1 w-full min-h-[185px] max-h-[220px] relative flex items-center justify-center my-0.5">
        <RadarChart
          data={activeConfig.seriesData}
          metrics={activeConfig.metrics}
          hoveredIndex={hoveredIndex}
          onHoverChange={setHoveredIndex}
          size={205}
          levels={4}
          margin={36}
        >
          <RadarGrid showLabels={false} stroke="var(--border)" strokeOpacity={0.65} />
          <RadarAxis stroke="var(--border)" strokeOpacity={0.5} />
          <RadarLabels offset={14} fontSize={10} />
          {activeConfig.seriesData.map((s, i) => (
            <RadarArea
              key={`radar-area-${s.label}-${i}`}
              index={i}
              color={s.color}
              showPoints={true}
              showStroke={true}
              showGlow={true}
            />
          ))}
        </RadarChart>
      </div>

      {/* Bottom Data Legend & Metrics Row */}
      <div className="mt-1 pt-1.5 border-t border-blue-900/30">
        {viewMode === 'sentiment' ? (
          <div className="space-y-1.5">
            {/* Long & Short Summary Cards in Dark Blue */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Long Contracts item */}
              <div 
                onMouseEnter={() => setHoveredIndex(0)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  hoveredIndex === 0
                    ? 'bg-blue-900/40 border-blue-500/60 shadow-md'
                    : 'bg-blue-950/60 border-blue-900/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: activeConfig.seriesData[0]?.color }} 
                    />
                    <span className="text-[10px] font-medium text-blue-300">Long</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-400">
                    {longPct.toFixed(1)}%
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-blue-100 mt-0.5">
                  {formatCurrency(totalLong)}
                </div>
              </div>

              {/* Short Contracts item */}
              <div 
                onMouseEnter={() => setHoveredIndex(1)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  hoveredIndex === 1
                    ? 'bg-blue-900/40 border-blue-600/60 shadow-md'
                    : 'bg-blue-950/60 border-blue-900/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: activeConfig.seriesData[1]?.color }} 
                    />
                    <span className="text-[10px] font-medium text-blue-300">Short</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-400">
                    {shortPct.toFixed(1)}%
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-blue-100 mt-0.5">
                  {formatCurrency(totalShort)}
                </div>
              </div>
            </div>

            {/* Bullish vs Bearish Progress Bar */}
            <div className="w-full bg-blue-950 border border-blue-900/40 h-1.5 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-blue-500 transition-all duration-500" 
                style={{ width: `${longPct}%` }}
                title={`Long: ${longPct.toFixed(1)}%`}
              />
              <div 
                className="h-full bg-blue-800 transition-all duration-500" 
                style={{ width: `${shortPct}%` }}
                title={`Short: ${shortPct.toFixed(1)}%`}
              />
            </div>
          </div>
        ) : (
          /* Sectors Legend in Dark Blue */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 pt-0.5">
            {activeConfig.seriesData.map((item, idx) => {
              const sectorStats = sectorMetricsMap[item.label];
              const vol = sectorStats?.total || 0;
              const isHovered = hoveredIndex === idx;
              return (
                <div
                  key={item.label}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`px-1.5 py-1 rounded-md border transition-all cursor-pointer flex flex-col justify-between ${
                    isHovered
                      ? 'bg-blue-900/50 border-blue-500/60 shadow-md'
                      : 'bg-blue-950/50 border-blue-900/40 hover:bg-blue-900/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[10px] font-medium truncate text-blue-200">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-blue-300/80 mt-0.5">
                    <span>{formatCurrency(vol)}</span>
                    <span className="font-semibold text-blue-200">
                      {totalContracts > 0 ? `${((vol / totalContracts) * 100).toFixed(0)}%` : '0%'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const RingChartCard = RadarChartCard;
export default RadarChartCard;
