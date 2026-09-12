
import React from 'react';
import { SummaryRow, ThemeMode } from '../types';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { formatCurrency } from '../utils';

interface MarketTickerProps {
  data: SummaryRow[];
  themeMode: ThemeMode;
}

const MarketTicker: React.FC<MarketTickerProps> = ({ data, themeMode }) => {
  // We duplicate the data to create a seamless loop
  const tickerItems = [...data, ...data];

  const getThemeStyles = () => {
    if (themeMode === 'light') {
      return {
        bg: 'bg-white border-b border-slate-200',
        text: 'text-slate-600',
        divider: 'bg-slate-200',
        highlight: 'text-slate-900',
        positive: 'text-emerald-600',
        negative: 'text-rose-600',
        neutral: 'text-slate-400'
      };
    }
    return {
      bg: 'bg-slate-950/80 border-b border-blue-500/10 backdrop-blur-md',
      text: 'text-slate-400',
      divider: 'bg-blue-500/20',
      highlight: 'text-slate-200',
      positive: 'text-emerald-400',
      negative: 'text-rose-400',
      neutral: 'text-blue-300/50'
    };
  };

  const styles = getThemeStyles();

  if (data.length === 0) return null;

  return (
    <div className={`w-full overflow-hidden h-10 flex items-center select-none z-40 transition-colors duration-500 ${styles.bg}`}>
      <div className="animate-marquee hover:pause flex items-center">
        {tickerItems.map((item, index) => {
          const change = item["Net Change"];
          const isPositive = change > 0;
          const isNegative = change < 0;
          
          return (
            <div key={`${item.Commodity}-${index}`} className="flex items-center px-4 gap-3 shrink-0">
              <span className={`text-xs font-medium uppercase tracking-wider font-heading ${styles.highlight}`}>
                {item.Commodity}
              </span>
              
              <div className="flex items-center gap-2">
                 <span className={`text-xs font-mono font-medium ${styles.text}`}>
                    {formatCurrency(item["Net Positions"])}
                 </span>
                 
                 <div className={`flex items-center text-[10px] font-medium ${isPositive ? styles.positive : isNegative ? styles.negative : styles.neutral}`}>
                    {isPositive ? <ArrowUp className="w-3 h-3" /> : isNegative ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    <span>{formatCurrency(Math.abs(change))}</span>
                 </div>
              </div>

              <div className={`w-px h-3 mx-2 ${styles.divider}`}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketTicker;
