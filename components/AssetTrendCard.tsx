
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import { curveMonotoneX } from "@visx/curve";
import { HistoryRow, SummaryRow, ThemeMode } from '../types';
import { formatCurrency } from '../utils';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowUp, 
  ArrowDown, 
  Minus,
  Coins, 
  Bitcoin, 
  Euro, 
  TrendingUp, 
  Activity, 
  DollarSign, 
  PoundSterling, 
  JapaneseYen, 
  SwissFranc, 
  Wheat, 
  Droplet, 
  Flame, 
  Sprout 
} from 'lucide-react';

interface AssetTrendCardProps {
  title: string;
  commodity: string;
  summaryRow?: SummaryRow;
  historyRow?: HistoryRow;
  dates: string[];
  onClick: () => void;
  isSelected: boolean;
  themeMode: ThemeMode;
  index?: number;
}

const AssetTrendCard: React.FC<AssetTrendCardProps> = ({ 
  title, 
  summaryRow, 
  historyRow, 
  dates,
  onClick,
  isSelected,
  themeMode,
  index = 0
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Strict Theme Icon Coloring (Only Light vs Ocean)
  const getAssetIcon = (name: string) => {
    const n = name.toLowerCase();
    const baseClass = "w-7 h-7 transition-colors duration-300";

    // Determine color based strictly on Theme Mode first, then Asset Type
    let colorClass = "";

    if (themeMode === 'light') {
       if (n.includes('bitcoin') || n.includes('crypto')) colorClass = "text-orange-500";
       else if (n.includes('gold')) colorClass = "text-yellow-600";
       else if (n.includes('oil') || n.includes('gas')) colorClass = "text-slate-700";
       else if (n.includes('euro') || n.includes('pound')) colorClass = "text-blue-600";
       else colorClass = "text-slate-600";
    } 
    else {
       // Ocean (Default) - Cool Blues/Cyans + Semantic
       if (n.includes('bitcoin')) colorClass = "text-orange-500";
       else if (n.includes('gold')) colorClass = "text-yellow-400";
       else if (n.includes('oil')) colorClass = "text-slate-400";
       else colorClass = "text-blue-400";
    }

    const className = `${baseClass} ${colorClass}`;

    // Icon Selection
    if (n.includes('bitcoin') || n.includes('btc')) return <Bitcoin className={className} />;
    if (n.includes('ether') || n.includes('eth')) return <Activity className={className} />;
    if (n.includes('euro') || n.includes('eur')) return <Euro className={className} />;
    if (n.includes('pound') || n.includes('british') || n.includes('gbp')) return <PoundSterling className={className} />;
    if (n.includes('yen') || n.includes('japanese') || n.includes('jpy')) return <JapaneseYen className={className} />;
    if (n.includes('franc') || n.includes('swiss') || n.includes('chf')) return <SwissFranc className={className} />;
    if (n.includes('australian') || n.includes('aud')) return <DollarSign className={className} />;
    if (n.includes('zealand') || n.includes('nzd')) return <DollarSign className={className} />;
    if (n.includes('canadian') || n.includes('cad')) return <DollarSign className={className} />;
    if (n.includes('dollar') || n.includes('usd') || n.includes('index')) return <DollarSign className={className} />;
    if (n.includes('gold') || n.includes('silver') || n.includes('palladium')) return <Coins className={className} />;
    if (n.includes('natural gas')) return <Flame className={className} />;
    if (n.includes('oil') || n.includes('gasoline')) return <Droplet className={className} />;
    if (n.includes('wheat') || n.includes('corn') || n.includes('soy')) return <Wheat className={className} />;
    if (n.includes('dow') || n.includes('s&p') || n.includes('nasdaq') || n.includes('russell')) return <TrendingUp className={className} />;

    return <Activity className={className} />;
  };

  const chartData = useMemo(() => {
    if (!historyRow) return [];
    
    const rawData = dates.map(date => ({
      date: date,
      value: historyRow[date] as number
    }));

    const dataWithChanges = rawData.map((item, i) => {
        const prevItem = rawData[i + 1]; 
        const change = prevItem ? item.value - prevItem.value : 0; 
        return { ...item, change };
    });

    return dataWithChanges.reverse().map(d => ({
        name: d.date.split(',')[0],
        fullDate: d.date,
        value: d.value,
        change: d.change
    }));
  }, [historyRow, dates]);

  if (!summaryRow) {
    return (
        <div className="bg-slate-900/40 p-6 rounded-2xl border border-blue-500/10 flex items-center justify-center h-48 backdrop-blur-sm">
            <span className="text-slate-500 text-xs">No data for {title}</span>
        </div>
    );
  }

  const netPos = summaryRow["Net Positions"];
  const netChange = summaryRow["Net Change"];
  const longPos = summaryRow["Long Positions"];
  const longChange = summaryRow["Long Change"];
  const shortPos = summaryRow["Short Positions"];
  const shortChange = summaryRow["Short Change"];
  
  const isNetPositive = netPos > 0;
  const isChangePositive = netChange > 0;
  const chartId = `chart-${title.replace(/\s+/g, '-')}`;

  // Chart Colors - Enforce Blue consistency across themes regardless of sentiment
  let strokeColor = "#3b82f6";
  let gradientColor = "#3b82f6";
  
  if (themeMode === 'light') {
      strokeColor = "#2563eb"; // Blue-600
      gradientColor = "#3b82f6";
  } else {
      // Ocean Mode - Always Blue
      strokeColor = "#3b82f6"; 
      gradientColor = "#3b82f6";
  }

  const gradientOpacity = isHovered ? 0.35 : 0.15;

  // Theme Base Styles
  const getThemeBaseStyles = () => {
    if (themeMode === 'light') {
        return isSelected 
            ? 'bg-white border-blue-500 shadow-xl ring-1 ring-blue-400 z-10' 
            : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-blue-500/20 hover:shadow-xl';
    }
    // Ocean / Default
    return isSelected 
        ? 'bg-slate-950 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.3)] ring-1 ring-blue-400 z-10' 
        : 'bg-slate-900/60 border-blue-500/10 hover:border-blue-500/50 hover:bg-slate-900/90 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]';
  };

  const getTextColor = (type: 'primary' | 'secondary' | 'sub') => {
      if (themeMode === 'light') {
          if (type === 'primary') return 'text-slate-900 group-hover:text-blue-700';
          if (type === 'secondary') return 'text-slate-600';
          if (type === 'sub') return 'text-slate-400';
      }
      // Ocean default
      if (type === 'primary') return 'text-slate-100 group-hover:text-white';
      if (type === 'secondary') return 'text-slate-400';
      return 'text-slate-500';
  };

  const getPillStyle = (positive: boolean) => {
      if (themeMode === 'light') {
          return positive ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-rose-100 text-rose-700 border-rose-200';
      }
      // Ocean
      return positive 
        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
        : 'bg-rose-500/10 border-rose-500/30 text-rose-400';
  };

  // Tooltip Style per theme
  const getTooltipStyle = () => {
      if (themeMode === 'light') return 'bg-white/95 border-slate-200 text-slate-800';
      return 'bg-slate-900/95 border-blue-500/30 text-slate-300';
  };

  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative rounded-2xl border cursor-pointer transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) overflow-hidden group flex flex-col justify-between backdrop-blur-md 
        ${getThemeBaseStyles()} ${isSelected ? 'scale-[1.03] -translate-y-1' : 'hover:scale-[1.03] hover:-translate-y-1'}`}
    >
      {/* Header Section */}
      <div className="p-6 pb-2 relative z-10">
        <div className="flex justify-between items-center gap-4">
            {/* Left Column: Title & Context */}
            <div className="flex flex-col gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl border shrink-0 transition-all duration-300 
                        ${themeMode === 'light' ? 'bg-slate-100 border-slate-200' : 
                          'bg-slate-950/60 border-blue-500/10 group-hover:border-blue-500/50 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]'}
                    `}>
                        {getAssetIcon(title)}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h3 className={`font-bold text-lg leading-none tracking-tight font-heading truncate pr-2 transition-colors ${getTextColor('primary')}`}>{title}</h3>
                        <span className={`text-[11px] font-bold uppercase tracking-wider mt-1.5 ${getTextColor('sub')}`}>Futures</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 mt-1 pl-1">
                     <span className={`text-xs font-bold flex items-center px-2.5 py-1 rounded-md border backdrop-blur-md ${getPillStyle(isChangePositive)}`}>
                        {isChangePositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-1"/> : <ArrowDownRight className="w-3.5 h-3.5 mr-1"/>}
                        {formatCurrency(Math.abs(netChange))}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${getTextColor('secondary')}`}>Net Chg</span>
                </div>
            </div>
        </div>
      </div>

      {/* Sparkline Chart */}
      <div className="h-28 w-full px-0 opacity-80 group-hover:opacity-100 transition-all duration-500 mt-2 relative z-10 -mb-2">
        <ResponsiveContainer width="100%" height="100%">
          {/* Added margin to prevent stroke clipping at top/bottom */}
          <AreaChart data={chartData} margin={{ top: 12, right: 0, left: 0, bottom: 12 }}>
            <defs>
              <linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradientColor} stopOpacity={gradientOpacity}/>
                <stop offset="95%" stopColor={gradientColor} stopOpacity={0}/>
              </linearGradient>
              {/* Segment sweep highlight animation across X axis */}
              <linearGradient id={`${chartId}-shimmer`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.1" />
                <stop offset="50%" stopColor={strokeColor} stopOpacity="0.8">
                  <animate attributeName="offset" values="-0.3; 1.3" dur="3s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={themeMode === 'light' ? '#e2e8f0' : '#1e293b'} strokeDasharray="3 3" opacity={0.5} />
            <ReferenceLine y={0} stroke={themeMode === 'light' ? '#cbd5e1' : '#334155'} strokeDasharray="3 3" />
            <Area 
              type={curveMonotoneX as any} 
              dataKey="value" 
              stroke={strokeColor} 
              strokeWidth={isHovered ? 2.5 : 2}
              fill={`url(#${chartId})`}
              fillOpacity={0.3}
              isAnimationActive={true}
              animationDuration={1600}
              animationEasing="ease-in-out"
              animationBegin={index * 140}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: themeMode === 'light' ? '#fff' : "#000", fill: strokeColor }}
            />
            {/* Animated Segment Line Highlight */}
            <Area 
              type={curveMonotoneX as any} 
              dataKey="value" 
              stroke={`url(#${chartId}-shimmer)`}
              strokeWidth={isHovered ? 3 : 2}
              fill="none"
              isAnimationActive={true}
              animationDuration={1800}
              animationEasing="ease-in-out"
              animationBegin={index * 140 + 150}
              dot={false}
            />
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Tooltip 
                cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '4 4' }}
                wrapperStyle={{ outline: 'none' }}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const isPositiveChange = data.change > 0;
                        return (
                            <div className={`backdrop-blur-xl border rounded-xl p-3 shadow-xl text-xs min-w-[140px] animate-in fade-in zoom-in-95 duration-200 ${getTooltipStyle()}`}>
                                <div className={`font-medium mb-2 pb-2 border-b flex justify-between ${themeMode === 'light' ? 'border-slate-100 text-slate-500' : 'border-white/10 opacity-70'}`}>
                                    <span>{data.fullDate}</span>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="opacity-70">Net Pos</span>
                                        <span className={`font-mono font-bold ${data.value > 0 ? (themeMode === 'light' ? 'text-blue-600' : 'text-blue-400') : (themeMode === 'light' ? 'text-rose-600' : 'text-rose-400')}`}>
                                            {formatCurrency(data.value)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="opacity-60">Weekly Chg</span>
                                        <span className={`font-mono font-bold flex items-center ${isPositiveChange ? (themeMode === 'light' ? 'text-emerald-600' : 'text-emerald-400') : data.change < 0 ? (themeMode === 'light' ? 'text-rose-600' : 'text-rose-400') : 'opacity-50'}`}>
                                            {isPositiveChange ? '+' : ''}{formatCurrency(data.change)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    return null;
                }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Long/Short Breakdown Footer */}
      <div className={`grid grid-cols-2 gap-px mt-0 border-t relative z-10 
          ${themeMode === 'light' ? 'bg-slate-100 border-slate-200' : 
            'bg-blue-500/5 border-blue-500/5'}
      `}>
          <div className={`p-4 flex flex-col items-center border-r transition-colors 
            ${themeMode === 'light' ? 'border-slate-200 hover:bg-white' : 
              'border-blue-500/5 hover:bg-blue-900/10'}`}>
              <span className={`text-[10px] uppercase font-bold tracking-wide mb-1 opacity-60`}>Longs</span>
              
              <div className={`flex items-center gap-1 text-xl font-bold font-mono ${longChange > 0 ? (themeMode === 'light' ? 'text-blue-600' : 'text-blue-400') : (themeMode === 'light' ? 'text-rose-600' : 'text-rose-400')}`}>
                  {longChange > 0 ? <ArrowUpRight className="w-5 h-5" /> : longChange < 0 ? <ArrowDownRight className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                  <span>{formatCurrency(Math.abs(longChange))}</span>
              </div>
              
              <span className={`text-[10px] font-bold font-mono mt-0.5 opacity-40`}>
                  Pos: {formatCurrency(longPos)}
              </span>
          </div>
          <div className={`p-4 flex flex-col items-center transition-colors ${themeMode === 'light' ? 'hover:bg-white' : 'hover:bg-slate-800/50'}`}>
              <span className={`text-[10px] uppercase font-bold tracking-wide mb-1 opacity-60`}>Shorts</span>
              
              <div className={`flex items-center gap-1 text-xl font-bold font-mono ${shortChange > 0 ? (themeMode === 'light' ? 'text-blue-600' : 'text-blue-400') : (themeMode === 'light' ? 'text-rose-600' : 'text-rose-400')}`}>
                  {shortChange > 0 ? <ArrowUpRight className="w-5 h-5" /> : shortChange < 0 ? <ArrowDownRight className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                  <span>{formatCurrency(Math.abs(shortChange))}</span>
              </div>

              <span className={`text-[10px] font-bold font-mono mt-0.5 opacity-40`}>
                  Pos: {formatCurrency(shortPos)}
              </span>
          </div>
      </div>
      
      {/* Subtle Background Glow */}
      <div className={`absolute top-0 right-0 w-full h-full bg-gradient-to-br to-transparent pointer-events-none transition-opacity duration-500 z-0
         ${isHovered ? 'opacity-20' : 'opacity-10'}
         ${themeMode === 'light' ? (isNetPositive ? 'from-blue-50' : 'from-rose-50') : 
           isNetPositive ? 'from-blue-500/10' : 'from-rose-500/10'}
      `} />
    </div>
  );
};

export default AssetTrendCard;
