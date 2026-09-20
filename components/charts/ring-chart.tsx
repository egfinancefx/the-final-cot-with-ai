"use client";

import React, { createContext, useContext, useMemo, ReactNode } from "react";
import { motion } from "motion/react";

export interface RingDatum {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
  formattedValue?: string;
  [key: string]: any;
}

interface RingChartContextValue {
  data: RingDatum[];
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
  size: number;
  innerRadius: number;
  outerRadius: number;
  strokeWidth: number;
  total: number;
}

const RingChartContext = createContext<RingChartContextValue | null>(null);

export function useRingChart() {
  const context = useContext(RingChartContext);
  if (!context) {
    throw new Error("useRingChart must be used within a RingChart provider");
  }
  return context;
}

export interface RingChartProps {
  data: RingDatum[];
  hoveredIndex?: number | null;
  onHoverChange?: (index: number | null) => void;
  size?: number;
  strokeWidth?: number;
  children: ReactNode;
  className?: string;
}

export const RingChart: React.FC<RingChartProps> = ({
  data,
  hoveredIndex = null,
  onHoverChange = () => {},
  size = 180,
  strokeWidth = 14,
  children,
  className = ""
}) => {
  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + (item.value || 0), 0) || 1;
  }, [data]);

  const outerRadius = size / 2 - 10;
  const innerRadius = outerRadius - strokeWidth;

  const contextValue = useMemo<RingChartContextValue>(() => ({
    data,
    hoveredIndex: hoveredIndex ?? null,
    setHoveredIndex: onHoverChange,
    size,
    innerRadius,
    outerRadius,
    strokeWidth,
    total
  }), [data, hoveredIndex, onHoverChange, size, innerRadius, outerRadius, strokeWidth, total]);

  return (
    <RingChartContext.Provider value={contextValue}>
      <div 
        className={`relative flex items-center justify-center select-none ${className}`}
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="overflow-visible">
          {children}
        </svg>
      </div>
    </RingChartContext.Provider>
  );
};

export interface RingProps {
  index: number;
  className?: string;
}

export const Ring: React.FC<RingProps> = ({ index, className = "" }) => {
  const { data, hoveredIndex, setHoveredIndex, size, outerRadius, strokeWidth, total } = useRingChart();

  const item = data[index];
  if (!item) return null;

  const center = size / 2;
  const radius = outerRadius - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate segment offset based on previous items
  let cumulativeValue = 0;
  for (let i = 0; i < index; i++) {
    cumulativeValue += data[i].value || 0;
  }

  const fraction = Math.max(0, (item.value || 0) / total);
  const gap = data.length > 1 ? 5 : 0;
  const strokeDasharray = `${Math.max(0, fraction * circumference - gap)} ${circumference}`;
  const strokeDashoffset = -(cumulativeValue / total) * circumference;

  const isHovered = hoveredIndex === index;
  const isDimmed = hoveredIndex !== null && !isHovered;

  const color = item.color || "#3b82f6";

  return (
    <g
      className="cursor-pointer transition-all duration-300"
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {/* Background track */}
      {index === 0 && (
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-200/50 dark:text-slate-800/60"
          strokeWidth={strokeWidth}
        />
      )}
      <motion.circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        animate={{
          opacity: isDimmed ? 0.35 : 1,
          scale: isHovered ? 1.03 : 1,
          transition: { duration: 0.2 }
        }}
        style={{ originX: `${center}px`, originY: `${center}px` }}
        className={`transition-all duration-200 ${className}`}
      />
    </g>
  );
};

export interface RingCenterProps {
  defaultLabel?: string;
  defaultValue?: string | number;
  className?: string;
}

export const RingCenter: React.FC<RingCenterProps> = ({
  defaultLabel = "Total",
  defaultValue,
  className = ""
}) => {
  const { data, hoveredIndex, total } = useRingChart();

  const activeItem = hoveredIndex !== null && data[hoveredIndex] ? data[hoveredIndex] : null;

  const label = activeItem ? activeItem.label : defaultLabel;
  const value = activeItem 
    ? (activeItem.formattedValue || activeItem.value.toLocaleString()) 
    : (defaultValue !== undefined ? defaultValue : total.toLocaleString());

  const pct = activeItem && total > 0 
    ? ((activeItem.value / total) * 100).toFixed(1) + "%" 
    : null;

  return (
    <foreignObject x="15%" y="15%" width="70%" height="70%" className="overflow-visible pointer-events-none">
      <div className={`w-full h-full flex flex-col items-center justify-center text-center leading-tight ${className}`}>
        {pct ? (
          <span className="text-base sm:text-lg font-bold font-mono text-blue-500 tracking-tight transition-all">
            {pct}
          </span>
        ) : (
          <span className="text-sm sm:text-base font-bold font-mono text-slate-800 dark:text-slate-100 tracking-tight transition-all">
            {value}
          </span>
        )}
        <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-full px-1">
          {label}
        </span>
      </div>
    </foreignObject>
  );
};

// -------------------------------------------------------------
// Legend Components
// -------------------------------------------------------------

interface LegendContextValue {
  hoveredIndex: number | null;
  onHoverChange: (index: number | null) => void;
  items: RingDatum[];
  total: number;
}

const LegendContext = createContext<LegendContextValue | null>(null);

export interface LegendProps {
  hoveredIndex?: number | null;
  items: RingDatum[];
  onHoverChange?: (index: number | null) => void;
  children: ReactNode;
  className?: string;
}

export const Legend: React.FC<LegendProps> = ({
  hoveredIndex = null,
  items,
  onHoverChange = () => {},
  children,
  className = ""
}) => {
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.value || 0), 0) || 1;
  }, [items]);

  const value = useMemo(() => ({
    hoveredIndex: hoveredIndex ?? null,
    onHoverChange,
    items,
    total
  }), [hoveredIndex, onHoverChange, items, total]);

  return (
    <LegendContext.Provider value={value}>
      <div className={`flex flex-col gap-1 w-full ${className}`}>
        {items.map((item, index) => (
          <LegendItemProvider key={index} item={item} index={index}>
            {children}
          </LegendItemProvider>
        ))}
      </div>
    </LegendContext.Provider>
  );
};

interface LegendItemContextValue {
  item: RingDatum;
  index: number;
  isHovered: boolean;
  isDimmed: boolean;
}

const LegendItemContext = createContext<LegendItemContextValue | null>(null);

const LegendItemProvider: React.FC<{ item: RingDatum; index: number; children: ReactNode }> = ({
  item,
  index,
  children
}) => {
  const legend = useContext(LegendContext);
  const isHovered = legend?.hoveredIndex === index;
  const isDimmed = legend?.hoveredIndex !== null && !isHovered;

  const value = useMemo(() => ({
    item,
    index,
    isHovered,
    isDimmed
  }), [item, index, isHovered, isDimmed]);

  return (
    <LegendItemContext.Provider value={value}>
      {children}
    </LegendItemContext.Provider>
  );
};

export const LegendItemComponent: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = ""
}) => {
  const legend = useContext(LegendContext);
  const itemCtx = useContext(LegendItemContext);

  if (!itemCtx) return null;

  const { index, isHovered, isDimmed } = itemCtx;

  return (
    <div
      onMouseEnter={() => legend?.onHoverChange(index)}
      onMouseLeave={() => legend?.onHoverChange(null)}
      className={`flex items-center justify-between px-2 py-1 rounded-lg border transition-all duration-200 cursor-pointer ${
        isHovered
          ? "bg-slate-100/90 dark:bg-slate-800/80 border-blue-500/40 shadow-sm scale-[1.01]"
          : isDimmed
          ? "opacity-40 border-transparent"
          : "bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const LegendMarker: React.FC<{ className?: string }> = ({ className = "" }) => {
  const itemCtx = useContext(LegendItemContext);
  if (!itemCtx) return null;

  return (
    <div
      className={`w-2 h-2 rounded-full shrink-0 ${className}`}
      style={{ backgroundColor: itemCtx.item.color || "#3b82f6" }}
    />
  );
};

export const LegendLabel: React.FC<{ className?: string }> = ({ className = "" }) => {
  const itemCtx = useContext(LegendItemContext);
  if (!itemCtx) return null;

  return (
    <span className={`text-[10px] sm:text-[11px] font-medium truncate flex-1 mx-2 text-slate-700 dark:text-slate-300 ${className}`}>
      {itemCtx.item.label}
    </span>
  );
};

export const LegendValue: React.FC<{ showPercentage?: boolean; className?: string }> = ({
  showPercentage = false,
  className = ""
}) => {
  const legend = useContext(LegendContext);
  const itemCtx = useContext(LegendItemContext);
  if (!itemCtx || !legend) return null;

  const { item } = itemCtx;
  const pct = legend.total > 0 ? ((item.value / legend.total) * 100).toFixed(1) + "%" : "0%";

  return (
    <div className={`flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] font-medium shrink-0 ${className}`}>
      {showPercentage && (
        <span className="text-slate-400 dark:text-slate-500 text-[9px] sm:text-[10px]">
          ({pct})
        </span>
      )}
      <span className="text-slate-800 dark:text-slate-200">
        {item.formattedValue || item.value.toLocaleString()}
      </span>
    </div>
  );
};

export const LegendProgress: React.FC<{ className?: string }> = ({ className = "" }) => {
  const legend = useContext(LegendContext);
  const itemCtx = useContext(LegendItemContext);
  if (!itemCtx || !legend) return null;

  const { item } = itemCtx;
  const pct = legend.total > 0 ? Math.min(100, Math.max(0, (item.value / legend.total) * 100)) : 0;

  return (
    <div className={`w-10 sm:w-12 h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden ml-2 shrink-0 ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, backgroundColor: item.color || "#3b82f6" }}
      />
    </div>
  );
};
