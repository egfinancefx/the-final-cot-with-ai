import React, { useMemo } from 'react';
import { X, Map as MapIcon, TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import { SummaryRow } from '../types';
import { formatCurrency } from '../utils';

interface HeatmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SummaryRow[];
  themeMode: 'light' | 'dark';
}

const HeatmapModal: React.FC<HeatmapModalProps> = ({ isOpen, onClose, data, themeMode }) => {
  const isLight = themeMode === 'light';

  // Process data for the heatmap
  const heatmapData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(item => {
      const totalPositions = item["Long Positions"] + item["Short Positions"];
      const longRatio = totalPositions > 0 ? item["Long Positions"] / totalPositions : 0.5;
      const shortRatio = totalPositions > 0 ? item["Short Positions"] / totalPositions : 0.5;
      
      // Determine color intensity based on how extreme the ratio is
      let colorClass = '';
      let intensity = 0;
      let status = '';

      if (longRatio > 0.6) {
        intensity = Math.min(100, Math.round((longRatio - 0.5) * 200));
        colorClass = isLight ? `bg-emerald-${Math.min(900, Math.max(100, Math.round(intensity/10)*100))}` : `bg-emerald-500`;
        status = 'Bullish';
      } else if (shortRatio > 0.6) {
        intensity = Math.min(100, Math.round((shortRatio - 0.5) * 200));
        colorClass = isLight ? `bg-rose-${Math.min(900, Math.max(100, Math.round(intensity/10)*100))}` : `bg-rose-500`;
        status = 'Bearish';
      } else {
        colorClass = isLight ? 'bg-slate-300' : 'bg-slate-700';
        status = 'Neutral';
      }

      // Calculate relative size based on Open Interest (or total positions if OI not available)
      const sizeValue = item["Open Interest"] || totalPositions;

      return {
        ...item,
        totalPositions,
        longRatio,
        shortRatio,
        colorClass,
        intensity,
        status,
        sizeValue
      };
    }).sort((a, b) => b.sizeValue - a.sizeValue); // Sort by size descending
  }, [data, isLight]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div 
        className={`relative w-full max-w-6xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 ${
          isLight ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-700'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-400'}`}>
              <MapIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Market Heatmap
              </h2>
              <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Visualizing institutional positioning across all assets
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`hidden sm:flex items-center gap-4 px-4 py-2 rounded-lg text-xs font-medium ${
              isLight ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-700'
            }`}>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
                <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>Net Long</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-slate-400"></div>
                <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>Neutral</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-rose-500"></div>
                <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>Net Short</span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className={`p-2 rounded-xl transition-colors ${
                isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Heatmap Grid Content */}
        <div className={`flex-1 p-6 overflow-y-auto custom-scrollbar ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-[160px]">
            {heatmapData.map((asset, idx) => {
              // Determine opacity based on intensity for dark mode to make it look like a heatmap
              const opacityStyle = !isLight && asset.status !== 'Neutral' 
                ? { opacity: 0.4 + (asset.intensity / 100) * 0.6 } 
                : {};

              const isExtreme = asset.longRatio > 0.8 || asset.shortRatio > 0.8;

              return (
                <div 
                  key={idx}
                  className={`relative rounded-2xl p-4 flex flex-col justify-between overflow-hidden group transition-transform hover:scale-[1.02] hover:z-10 hover:shadow-xl cursor-default ${
                    isLight 
                      ? asset.status === 'Bullish' ? 'bg-emerald-100 border-emerald-200 text-emerald-900' 
                        : asset.status === 'Bearish' ? 'bg-rose-100 border-rose-200 text-rose-900'
                        : 'bg-slate-200 border-slate-300 text-slate-700'
                      : `${asset.colorClass} text-white`
                  } border`}
                  style={opacityStyle}
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                  
                  {/* Extreme Badge */}
                  {isExtreme && (
                    <div className="absolute top-3 right-3">
                      <AlertTriangle className={`w-4 h-4 animate-pulse ${isLight ? 'opacity-50' : 'text-white/70'}`} />
                    </div>
                  )}

                  <div>
                    <h3 className="font-bold text-lg truncate pr-6">{asset.Commodity}</h3>
                    <div className={`text-xs font-medium uppercase tracking-wider mt-1 ${
                      isLight ? 'opacity-60' : 'text-white/60'
                    }`}>
                      {asset.status}
                    </div>
                  </div>

                  <div className="space-y-2 relative z-10">
                    <div className="flex justify-between items-end">
                      <div className={`text-xs ${isLight ? 'opacity-70' : 'text-white/70'}`}>Net Position</div>
                      <div className="font-mono font-bold">{formatCurrency(asset["Net Positions"])}</div>
                    </div>
                    
                    {/* Mini Sentiment Bar */}
                    <div className="h-1.5 w-full rounded-full overflow-hidden flex bg-black/10">
                      <div className="h-full bg-emerald-400" style={{ width: `${asset.longRatio * 100}%` }}></div>
                      <div className="h-full bg-rose-400" style={{ width: `${asset.shortRatio * 100}%` }}></div>
                    </div>
                    
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className={isLight ? 'text-emerald-700' : 'text-emerald-100'}>
                        {(asset.longRatio * 100).toFixed(0)}% L
                      </span>
                      <span className={isLight ? 'text-rose-700' : 'text-rose-100'}>
                        {(asset.shortRatio * 100).toFixed(0)}% S
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapModal;
