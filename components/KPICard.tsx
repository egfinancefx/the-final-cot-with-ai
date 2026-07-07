
import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ThemeMode } from '../types';

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  subtext?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'success' | 'danger' | 'neutral' | 'info';
  chartData?: { value: number }[];
  themeMode: ThemeMode;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, subtext, icon, variant = 'neutral', chartData, themeMode }) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  // Theme Definitions
  const getThemeStyles = (theme: ThemeMode, v: string) => {
    // Base Color Maps for each Theme
    const colors = {
      ocean: {
        primary: { 
            bg: "bg-slate-900", border: "border-blue-500/30", text: "text-white", 
            iconBg: "bg-blue-500/20", iconText: "text-blue-400", sub: "text-blue-200/60",
            chartStroke: "#60a5fa", chartFill: "#3b82f6", glow: "bg-blue-500/20" 
        },
        success: { 
            bg: "bg-slate-900", border: "border-emerald-500/30", text: "text-white", 
            iconBg: "bg-emerald-500/20", iconText: "text-emerald-400", sub: "text-emerald-200/60",
            chartStroke: "#34d399", chartFill: "#10b981", glow: "bg-emerald-500/20" 
        },
        danger: { 
            bg: "bg-slate-900", border: "border-rose-500/30", text: "text-white", 
            iconBg: "bg-rose-500/20", iconText: "text-rose-400", sub: "text-rose-200/60",
            chartStroke: "#fb7185", chartFill: "#f43f5e", glow: "bg-rose-500/20" 
        },
        info: { 
            bg: "bg-slate-900", border: "border-cyan-500/30", text: "text-white", 
            iconBg: "bg-cyan-500/20", iconText: "text-cyan-400", sub: "text-cyan-200/60",
            chartStroke: "#22d3ee", chartFill: "#06b6d4", glow: "bg-cyan-500/20" 
        },
        neutral: { bg: "bg-slate-900", border: "border-slate-700", text: "text-slate-200", iconBg: "bg-slate-700/50", iconText: "text-slate-400", sub: "text-slate-500", chartStroke: "#94a3b8", chartFill: "#64748b", glow: "bg-slate-500/10" }
      },
      light: {
        primary: { 
            bg: "bg-white", border: "border-blue-200", text: "text-slate-900", 
            iconBg: "bg-blue-100", iconText: "text-blue-600", sub: "text-slate-500",
            chartStroke: "#2563eb", chartFill: "#3b82f6", glow: "bg-blue-400/10" 
        },
        success: { 
            bg: "bg-white", border: "border-emerald-200", text: "text-slate-900", 
            iconBg: "bg-emerald-100", iconText: "text-emerald-600", sub: "text-slate-500",
            chartStroke: "#059669", chartFill: "#10b981", glow: "bg-emerald-400/10" 
        },
        danger: { 
            bg: "bg-white", border: "border-rose-200", text: "text-slate-900", 
            iconBg: "bg-rose-100", iconText: "text-rose-600", sub: "text-slate-500",
            chartStroke: "#e11d48", chartFill: "#f43f5e", glow: "bg-rose-400/10" 
        },
        info: { 
            bg: "bg-white", border: "border-cyan-200", text: "text-slate-900", 
            iconBg: "bg-cyan-100", iconText: "text-cyan-600", sub: "text-slate-500",
            chartStroke: "#0891b2", chartFill: "#06b6d4", glow: "bg-cyan-400/10" 
        },
        neutral: { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", iconBg: "bg-slate-200", iconText: "text-slate-600", sub: "text-slate-400", chartStroke: "#64748b", chartFill: "#94a3b8", glow: "bg-slate-400/5" }
      }
    };
    
    // @ts-ignore - dynamic access safe here
    return colors[theme]?.[v] || colors.ocean.neutral;
  };

  const style = getThemeStyles(themeMode, variant);
  
  // Dynamic pill style based on theme and value
  const getPillStyle = () => {
    if (themeMode === 'light') {
        if (isPositive) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (isNegative) return 'bg-rose-100 text-rose-700 border-rose-200';
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
    // Dark themes (Ocean)
    if (isPositive) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/20';
    if (isNegative) return 'bg-rose-500/10 text-rose-400 border-rose-500/20 group-hover:bg-rose-500/20';
    return 'bg-slate-800/40 text-slate-400 border-slate-700';
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${style.bg} ${style.border} p-5 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 flex flex-col justify-between group h-full min-h-[160px] ${themeMode === 'light' ? 'shadow-sm' : 'shadow-lg backdrop-blur-xl'}`}>
      
      {/* Decorative Glow */}
      <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full blur-[70px] ${style.glow} opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none z-0`} />

      <div className="flex justify-between items-start z-10">
        <div className="flex flex-col">
           <div className="flex items-center gap-2 mb-1">
             <span className={`text-[10px] font-bold uppercase tracking-widest ${style.sub} opacity-90`}>{title}</span>
           </div>
           <h3 className={`text-3xl font-black tracking-tighter font-heading ${style.text} drop-shadow-sm`}>{value}</h3>
        </div>
        
        {icon && (
            <div className={`p-2.5 rounded-xl border ${style.iconBg} ${style.iconText} ${style.border} shadow-sm backdrop-blur-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
            </div>
        )}
      </div>

      {/* Middle Section: Chart or Spacer */}
      <div className="flex-1 relative min-h-[50px] -mx-5 my-2">
         {chartData && chartData.length > 0 ? (
             <div className="absolute inset-0 w-full h-full opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 10 }}>
                        <defs>
                            <linearGradient id={`gradient-${variant}-${themeMode}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={style.chartFill} stopOpacity={0.4}/>
                                <stop offset="95%" stopColor={style.chartFill} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke={style.chartStroke} 
                            strokeWidth={2}
                            fill={`url(#gradient-${variant}-${themeMode})`}
                            isAnimationActive={true}
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
         ) : (
            // Fallback pattern
            <div className="w-full h-full opacity-5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-current via-transparent to-transparent" />
         )}
      </div>

      {/* Footer / Change Pill */}
      <div className="flex items-end justify-between z-10 mt-auto">
          <span className={`text-[11px] font-medium tracking-wide ${style.sub}`}>{subtext}</span>

          {(change !== undefined) && (
             <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold font-mono shadow-sm backdrop-blur-md transition-all duration-300 group-hover:shadow-md ${getPillStyle()}`}>
                {isPositive ? <ArrowUp className="w-3.5 h-3.5" /> : isNegative ? <ArrowDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                <span>{Math.abs(change).toLocaleString()}</span>
             </div>
          )}
      </div>
    </div>
  );
};

export default KPICard;
