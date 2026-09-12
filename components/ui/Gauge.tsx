"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";

interface GaugeProps {
  value: number;
  centerValue?: number;
  totalNotches?: number;
  activeFill?: string;
  inactiveFill?: string;
  className?: string;
  valueClassName?: string;
  size?: number;
  startAngle?: number;
  endAngle?: number;
  animationDelayMs?: number;
}

export function Gauge({
  value,
  centerValue,
  totalNotches = 40,
  activeFill = "#3b82f6",
  inactiveFill = "rgba(148, 163, 184, 0.2)",
  className = "",
  valueClassName = "",
  size = 120,
  startAngle = 135,
  endAngle = 405,
  animationDelayMs = 0,
}: GaugeProps) {
  const radius = size / 2;
  const notchLength = size * 0.15; // 15% of size
  const innerRadius = radius - notchLength;

  const notches = useMemo(() => {
    const notchList = [];
    for (let i = 0; i <= totalNotches; i++) {
      const percentage = i / totalNotches;
      const angle = startAngle + (endAngle - startAngle) * percentage;
      // Convert angle to radians
      const angleRad = (angle - 90) * (Math.PI / 180);
      
      const x1 = radius + innerRadius * Math.cos(angleRad);
      const y1 = radius + innerRadius * Math.sin(angleRad);
      const x2 = radius + radius * Math.cos(angleRad);
      const y2 = radius + radius * Math.sin(angleRad);

      const isActive = percentage * 100 <= value;

      notchList.push({
        x1, y1, x2, y2, isActive, index: i
      });
    }
    return notchList;
  }, [totalNotches, startAngle, endAngle, radius, innerRadius, value]);

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {notches.map((notch, i) => (
          <motion.line
            key={i}
            x1={notch.x1}
            y1={notch.y1}
            x2={notch.x2}
            y2={notch.y2}
            strokeLinecap="round"
            strokeWidth={size * 0.025}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: notch.isActive ? 1 : 0.4, 
              stroke: notch.isActive ? activeFill : inactiveFill,
              filter: notch.isActive ? `drop-shadow(0 0 4px ${activeFill})` : "drop-shadow(0 0 0px transparent)"
            }}
            transition={{ 
              duration: 0.5, 
              delay: (animationDelayMs / 1000) + (i * 0.015),
              ease: "easeOut"
            }}
          />
        ))}
      </svg>
      {centerValue !== undefined && (
        <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center font-mono pointer-events-none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: (animationDelayMs / 1000) + 0.3 }}
        >
          <NumberFlow 
            value={centerValue} 
            format={{ notation: "compact", maximumFractionDigits: 1 }}
            className={`text-sm font-semibold tracking-tight ${valueClassName}`}
          />
        </motion.div>
      )}
    </div>
  );
}
