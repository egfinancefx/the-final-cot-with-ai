import React, { useMemo } from 'react';
import { SummaryRow, ThemeMode } from '../types';
import { formatCurrency } from '../utils';
import {
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Coins,
  Bitcoin,
  Euro,
  Activity,
  DollarSign,
  TrendingUp,
  Droplet
} from 'lucide-react';

interface MostVolumeAssetsCardProps {
  summaryData: SummaryRow[];
  themeMode: ThemeMode;
  onSelectAsset?: (asset: string) => void;
  limit?: number;
}

export const MostVolumeAssetsCard: React.FC<MostVolumeAssetsCardProps> = ({
  summaryData,
  themeMode,
  onSelectAsset,
  limit = 4
}) => {
  const topVolumeAssets = useMemo(() => {
    if (!summaryData || summaryData.length === 0) return [];

    return [...summaryData]
      .map(row => {
        const longPos = row["Long Positions"] || 0;
        const shortPos = row["Short Positions"] || 0;
        const totalVolume = longPos + shortPos;
        const netChange = row["Net Change"] || 0;
        const longChange = row["Long Change"] || 0;
        const shortChange = row["Short Change"] || 0;
        const totalChange = Math.abs(netChange);
        const longPct = totalVolume > 0 ? (longPos / totalVolume) * 100 : 50;

        return {
          commodity: row.Commodity,
          totalVolume,
          netChange,
          longChange,
          shortChange,
          totalChange,
          longPct,
          longPos,
          shortPos
        };
      })
      // Filter those that had changes this week, and sort by total volume desc
      .filter(item => item.totalChange > 0 || item.totalVolume > 0)
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, limit);
  }, [summaryData, limit]);

  const getAssetIcon = (name: string) => {
    const n = name.toLowerCase();
    const className = "w-4 h-4";
    if (n.includes('bitcoin') || n.includes('btc')) return <Bitcoin className={className} />;
    if (n.includes('gold') || n.includes('silver')) return <Coins className={className} />;
    if (n.includes('euro') || n.includes('eur')) return <Euro className={className} />;
    if (n.includes('oil') || n.includes('gas')) return <Droplet className={className} />;
    if (n.includes('dollar') || n.includes('usd')) return <DollarSign className={className} />;
    if (n.includes('dow') || n.includes('s&p') || n.includes('nasdaq')) return <TrendingUp className={className} />;
    return <Activity className={className} />;
  };

  const cardBg = themeMode === 'light' 
    ? 'bg-white border-slate-200 shadow-xl' 
    : 'bg-slate-900/80 border-blue-500/10 shadow-2xl backdrop-blur-md';

  const textMain = themeMode === 'light' ? 'text-slate-900' : 'text-white';
  const textSub = themeMode === 'light' ? 'text-slate-500' : 'text-slate-400';
  const rowHover = themeMode === 'light' ? 'hover:bg-slate-50 border-slate-100' : 'hover:bg-blue-500/10 border-blue-900/20';

  return (
    <div className={`rounded-xl sm:rounded-2xl border p-3 sm:p-3.5 flex flex-col h-full transition-all duration-300 ${cardBg}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5 pb-2 border-b border-inherit">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${themeMode === 'light' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
            <Flame className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className={`text-xs sm:text-sm font-semibold font-heading tracking-tight leading-tight ${textMain}`}>
              Most Volume Assets
            </h3>
            <p className={`text-[10px] ${textSub}`}>Top open contracts & weekly flow</p>
          </div>
        </div>

        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${themeMode === 'light' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-300 border-white/10'}`}>
          This Week
        </span>
      </div>

      {/* List items */}
      <div className="flex-1 flex flex-col justify-between gap-1.5 overflow-hidden">
        {topVolumeAssets.length > 0 ? (
          topVolumeAssets.map((asset, index) => {
            const isPositive = asset.netChange > 0;
            const isNegative = asset.netChange < 0;

            return (
              <div
                key={asset.commodity}
                onClick={() => onSelectAsset && onSelectAsset(asset.commodity)}
                className={`group flex items-center justify-between p-1.5 sm:p-2 rounded-lg border transition-all duration-200 cursor-pointer ${rowHover}`}
              >
                {/* Left: Rank & Commodity */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold font-mono shrink-0 ${
                    index === 0 
                      ? 'bg-amber-500 text-white shadow-sm' 
                      : index === 1
                        ? 'bg-slate-300 text-slate-800'
                        : index === 2
                          ? 'bg-amber-700 text-white'
                          : (themeMode === 'light' ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400')
                  }`}>
                    {index + 1}
                  </span>

                  <div className={`p-1 rounded-md border shrink-0 ${themeMode === 'light' ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800/80 border-blue-500/10 text-blue-400 group-hover:border-blue-400'}`}>
                    {getAssetIcon(asset.commodity)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-medium truncate ${textMain} group-hover:text-blue-500 transition-colors`}>
                        {asset.commodity}
                      </span>
                    </div>

                    {/* Mini Long/Short Bar */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="h-1 w-14 sm:w-16 bg-slate-700/30 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-blue-500 rounded-l-full" 
                          style={{ width: `${asset.longPct}%` }}
                          title={`Long: ${asset.longPct.toFixed(0)}%`}
                        />
                        <div 
                          className={`h-full ${themeMode === 'light' ? 'bg-slate-300' : 'bg-slate-500'} rounded-r-full`} 
                          style={{ width: `${100 - asset.longPct}%` }}
                          title={`Short: ${(100 - asset.longPct).toFixed(0)}%`}
                        />
                      </div>
                      <span className={`text-[9px] font-mono ${textSub}`}>
                        {formatCurrency(asset.totalVolume)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Net Change pill */}
                <div className="flex flex-col items-end shrink-0 ml-1.5">
                  <span className={`text-[10px] font-medium font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5 border ${
                    isPositive
                      ? (themeMode === 'light' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')
                      : isNegative
                        ? (themeMode === 'light' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/10 text-rose-400 border-rose-500/20')
                        : (themeMode === 'light' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-white/5')
                  }`}>
                    {isPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : isNegative ? <ArrowDownRight className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                    {isPositive ? '+' : ''}{formatCurrency(asset.netChange)}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className={`p-4 text-center text-xs ${textSub}`}>
            No volume activity records.
          </div>
        )}
      </div>
    </div>
  );
};

export default MostVolumeAssetsCard;
