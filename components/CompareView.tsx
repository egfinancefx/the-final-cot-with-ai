import React, { useMemo } from 'react';
import { SummaryRow, HistoryRow, ThemeMode } from '../types';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import TradingViewWidget from './TradingViewWidget';
import { TV_SYMBOL_MAP } from '../constants';

interface CompareViewProps {
  assets: string[];
  summaryData: SummaryRow[];
  historyData: HistoryRow[];
  historyDates: string[];
  themeMode: ThemeMode;
  onBack: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6'];

const CustomLollipopBar = (props: any) => {
  const { fill, x, y, width, height, value } = props;
  const isPositive = Number(value) >= 0;
  const dotY = isPositive ? y : y + height;
  const lineWidth = 2;
  const lineX = x + width / 2 - lineWidth / 2;
  
  return (
    <g>
      <rect x={lineX} y={y} width={lineWidth} height={height} fill={fill} opacity={0.4} rx={1} />
      <circle cx={x + width / 2} cy={dotY} r={5} fill={fill} />
    </g>
  );
};

const CustomTooltip = ({ active, payload, label, themeMode, assets }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`px-4 py-3 rounded-2xl shadow-xl border ${
        themeMode === 'light' ? 'bg-white border-slate-100' : 'bg-slate-800 border-slate-700'
      }`}>
        <div className={`text-xs font-bold mb-2 text-center ${themeMode === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>
          {label}
        </div>
        <div className="flex flex-col gap-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className={`text-xs font-medium ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
                  {assets[parseInt(entry.name.split('_')[1])]}
                </span>
              </div>
              <span className={`text-sm font-bold ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const PremiumDistributionCard = ({ data, themeMode, formatCurrency }: any) => {
  const total = data.long + data.short;
  const longPercent = total > 0 ? ((data.long / total) * 100).toFixed(1) : '0.0';
  const shortPercent = total > 0 ? ((data.short / total) * 100).toFixed(1) : '0.0';
  const ratio = data.short > 0 ? (data.long / data.short).toFixed(2) : (data.long > 0 ? '∞' : '0');

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const longDash = total > 0 ? (data.long / total) * circumference : 0;

  const themeStyles = {
    bg: themeMode === 'light' ? 'bg-white' : 'bg-slate-900',
    border: themeMode === 'light' ? 'border-slate-200' : 'border-white/10',
    textMain: themeMode === 'light' ? 'text-slate-900' : 'text-white',
    textSub: themeMode === 'light' ? 'text-slate-500' : 'text-slate-400',
    cardBg: themeMode === 'light' ? 'bg-slate-50' : 'bg-slate-800/50',
  };

  return (
    <div className={`p-5 rounded-2xl border ${themeStyles.cardBg} ${themeStyles.border} relative overflow-hidden group`}>
      {/* Decorative background glow */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: data.color }}></div>
          <span className={`font-bold text-base ${themeStyles.textMain}`}>{data.name}</span>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${data.net >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
          Net: {formatCurrency(data.net)}
        </div>
      </div>

      <div className="flex items-center gap-6 relative z-10">
        {/* Premium Circle Chart */}
        <div className="relative flex items-center justify-center w-[110px] h-[110px] shrink-0">
          {/* Dashed outer ring for premium tech look */}
          <svg className="absolute inset-0 w-full h-full animate-[spin_60s_linear_infinite]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="none" stroke={themeMode === 'light' ? '#cbd5e1' : '#334155'} strokeWidth="1" strokeDasharray="4 4" />
          </svg>
          
          <svg width="90" height="90" viewBox="0 0 100 100" className="transform -rotate-90">
            {/* Background track (Short - Red) */}
            <circle 
              cx="50" cy="50" r={radius} 
              fill="none" 
              stroke="#ef4444" 
              strokeWidth="8"
              className="opacity-20"
            />
            <circle 
              cx="50" cy="50" r={radius} 
              fill="none" 
              stroke="#ef4444" 
              strokeWidth="8"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeLinecap="round"
            />
            {/* Foreground track (Long - Green) */}
            <circle 
              cx="50" cy="50" r={radius} 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="8"
              strokeDasharray={`${longDash} ${circumference}`}
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            />
          </svg>
          
          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${themeStyles.textSub}`}>Ratio</span>
            <span className={`text-lg font-black ${themeStyles.textMain}`}>{ratio}</span>
          </div>
        </div>

        {/* Stats Details */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                Long
              </span>
              <span className={`font-mono font-bold ${themeStyles.textMain}`}>{longPercent}%</span>
            </div>
            <span className={`text-xs font-mono ml-2.5 ${themeStyles.textSub}`}>{formatCurrency(data.long)}</span>
          </div>
          
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-500/20 to-transparent"></div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-500 font-bold flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                Short
              </span>
              <span className={`font-mono font-bold ${themeStyles.textMain}`}>{shortPercent}%</span>
            </div>
            <span className={`text-xs font-mono ml-2.5 ${themeStyles.textSub}`}>{formatCurrency(data.short)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CompareView: React.FC<CompareViewProps> = ({
  assets,
  summaryData,
  historyData,
  historyDates,
  themeMode,
  onBack
}) => {
  const themeStyles = {
    bg: themeMode === 'light' ? 'bg-white' : 'bg-slate-900',
    border: themeMode === 'light' ? 'border-slate-200' : 'border-white/10',
    textMain: themeMode === 'light' ? 'text-slate-900' : 'text-white',
    textSub: themeMode === 'light' ? 'text-slate-500' : 'text-slate-400',
    cardBg: themeMode === 'light' ? 'bg-slate-50' : 'bg-slate-800/50',
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare historical data for the line chart
  const historicalChartData = useMemo(() => {
    return historyDates.map(date => {
      const dataPoint: any = { date: date.split(',')[0], fullDate: date };
      assets.forEach((asset, index) => {
        const row = historyData.find(h => h.Commodity === asset);
        if (row) {
          dataPoint[`asset_${index}`] = row[date] as number;
        }
      });
      return dataPoint;
    }).reverse();
  }, [assets, historyData, historyDates]);

  // Prepare pie chart data
  const pieChartData = useMemo(() => {
    return assets.map((asset, index) => {
      const row = summaryData.find(s => s.Commodity === asset);
      if (!row) return null;
      return {
        name: asset,
        long: row['Long Positions'] || 0,
        short: row['Short Positions'] || 0,
        net: row['Net Positions'] || 0,
        color: COLORS[index % COLORS.length]
      };
    }).filter(Boolean);
  }, [assets, summaryData]);

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-10 custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              themeMode === 'light'
                ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h2 className={`text-2xl font-bold font-heading ${themeStyles.textMain}`}>
            Asset Comparison
          </h2>
        </div>
      </div>

      {/* TradingView Charts Grid */}
      <div className={`grid gap-4 mb-6 ${assets.length === 3 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {assets.map((asset, index) => (
          <div key={asset} className={`flex flex-col rounded-2xl border overflow-hidden ${themeStyles.bg} ${themeStyles.border} shadow-lg`} style={{ height: '400px' }}>
            <div className={`px-4 py-3 border-b flex items-center justify-between ${themeStyles.border}`}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <h3 className={`font-bold ${themeStyles.textMain}`}>{asset}</h3>
              </div>
              <span className={`text-xs font-mono px-2 py-1 rounded bg-opacity-20 ${themeMode === 'light' ? 'bg-slate-200 text-slate-700' : 'bg-slate-700 text-slate-300'}`}>
                {TV_SYMBOL_MAP[asset] || asset}
              </span>
            </div>
            <div className="flex-1 w-full">
              <TradingViewWidget symbol={TV_SYMBOL_MAP[asset] || "OANDA:XAUUSD"} themeMode={themeMode} />
            </div>
          </div>
        ))}
      </div>

      {/* Data Comparison Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Historical Comparison Chart */}
        <div className={`lg:col-span-2 rounded-3xl border shadow-xl p-5 ${themeStyles.bg} ${themeStyles.border}`}>
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${themeStyles.textMain}`}>
            <Activity className="w-5 h-5 text-blue-500" />
            Historical Net Position Comparison
          </h3>
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicalChartData} margin={{ top: 20, right: 10, left: 10, bottom: 10 }} barGap={4}>
                <CartesianGrid 
                  strokeDasharray="4 4" 
                  stroke={themeMode === 'light' ? '#e2e8f0' : '#1e293b'} 
                  vertical={true} 
                  horizontal={false} 
                />
                <XAxis 
                  dataKey="date" 
                  stroke={themeMode === 'light' ? '#94a3b8' : '#475569'} 
                  fontSize={12} 
                  tickMargin={15} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    if (isNaN(d.getTime())) return val;
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis hide={true} />
                <Tooltip 
                  content={<CustomTooltip themeMode={themeMode} assets={assets} />}
                  cursor={{ fill: themeMode === 'light' ? '#f1f5f9' : '#1e293b', opacity: 0.5 }}
                />
                <Legend 
                  formatter={(value) => assets[parseInt(value.split('_')[1])]}
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                {assets.map((asset, index) => (
                  <Bar
                    key={`bar-${index}`}
                    dataKey={`asset_${index}`}
                    fill={COLORS[index % COLORS.length]}
                    shape={<CustomLollipopBar />}
                    animationDuration={1500}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Long vs Short Pie Charts */}
        <div className={`rounded-3xl border shadow-xl p-5 flex flex-col ${themeStyles.bg} ${themeStyles.border}`}>
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${themeStyles.textMain}`}>
            <PieChartIcon className="w-5 h-5 text-purple-500" />
            Long vs Short Distribution
          </h3>
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
            {pieChartData.map((data, index) => {
              if (!data) return null;
              return <PremiumDistributionCard key={data.name} data={data} themeMode={themeMode} formatCurrency={formatCurrency} />;
            })}
          </div>
        </div>
      </div>

      {/* Summary Stats Table */}
      <div className={`rounded-3xl border shadow-xl overflow-hidden ${themeStyles.bg} ${themeStyles.border}`}>
        <div className={`p-5 border-b ${themeStyles.border}`}>
          <h3 className={`text-lg font-bold flex items-center gap-2 ${themeStyles.textMain}`}>
            <Activity className="w-5 h-5 text-indigo-500" />
            Comparison Summary
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className={`text-xs uppercase ${themeMode === 'light' ? 'bg-slate-50 text-slate-500' : 'bg-slate-800/50 text-slate-400'}`}>
              <tr>
                <th className="px-6 py-4 font-bold">Asset</th>
                <th className="px-6 py-4 font-bold text-right">Net Position</th>
                <th className="px-6 py-4 font-bold text-right">Net Change</th>
                <th className="px-6 py-4 font-bold text-right">Long</th>
                <th className="px-6 py-4 font-bold text-right">Short</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {assets.map((asset, index) => {
                const row = summaryData.find(s => s.Commodity === asset);
                if (!row) return null;
                return (
                  <tr key={asset} className={`transition-colors ${themeMode === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                    <td className="px-6 py-4 font-bold flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className={themeStyles.textMain}>{asset}</span>
                    </td>
                    <td className={`px-6 py-4 text-right font-mono font-bold ${row['Net Positions'] >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {formatCurrency(row['Net Positions'])}
                    </td>
                    <td className={`px-6 py-4 text-right font-mono font-bold ${row['Net Change'] >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {row['Net Change'] > 0 ? '+' : ''}{formatCurrency(row['Net Change'])}
                    </td>
                    <td className={`px-6 py-4 text-right font-mono ${themeStyles.textMain}`}>
                      {formatCurrency(row['Long Positions'])}
                      <div className={`text-[10px] mt-0.5 ${row['Long Change'] >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {row['Long Change'] > 0 ? '+' : ''}{formatCurrency(row['Long Change'])}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-right font-mono ${themeStyles.textMain}`}>
                      {formatCurrency(row['Short Positions'])}
                      <div className={`text-[10px] mt-0.5 ${row['Short Change'] >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {row['Short Change'] > 0 ? '+' : ''}{formatCurrency(row['Short Change'])}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompareView;
