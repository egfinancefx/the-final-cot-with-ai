"use client";

import type { Transition } from "motion/react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { chartCssVars, useChart } from "./chart-context";
import { useChartLegendHover } from "./chart-legend-hover";
import { transitionWithDelay } from "./motion-utils";
import { computeSeriesBarWidth } from "./series-bar-layout";

function computeSeriesBarLayout(input: {
  stacked: boolean;
  composedStackOffsets: Map<number, Map<string, number>> | undefined;
  rowIndex: number;
  dataKey: string;
  value: number;
  yScale: (n: number) => number | undefined;
  innerHeight: number;
  xCenter: number;
  barWidth: number;
  seriesCount: number;
  gap: number;
  seriesIndex: number;
  stackGap: number;
  isLastSeries: boolean;
  radius: number;
}): {
  barLeft: number;
  barHeight: number;
  effectiveRadius: number;
  valueY: number;
} {
  const {
    stacked,
    composedStackOffsets,
    rowIndex,
    dataKey,
    value,
    yScale,
    innerHeight,
    xCenter,
    barWidth,
    seriesCount,
    gap,
    seriesIndex,
    stackGap,
    isLastSeries,
    radius,
  } = input;

  if (stacked && composedStackOffsets) {
    const offset = composedStackOffsets.get(rowIndex)?.get(dataKey) ?? 0;
    const valuePos = yScale(value) ?? 0;
    let barHeight = innerHeight - valuePos;
    const offsetY = yScale(offset) ?? innerHeight;
    const gapOffset = seriesIndex * stackGap;
    const valueY = offsetY - barHeight - gapOffset;
    if (!isLastSeries && stackGap > 0) {
      barHeight = Math.max(0, barHeight - stackGap);
    }
    const barLeft = xCenter - barWidth / 2;
    const applyRounding = stackGap > 0 || isLastSeries;
    return {
      barLeft,
      barHeight,
      effectiveRadius: applyRounding ? radius : 0,
      valueY,
    };
  }

  const groupWidth =
    seriesCount * barWidth + (seriesCount > 1 ? (seriesCount - 1) * gap : 0);
  const valueY = yScale(value) ?? innerHeight;
  return {
    barLeft: xCenter - groupWidth / 2 + seriesIndex * (barWidth + gap),
    barHeight: innerHeight - valueY,
    effectiveRadius: radius,
    valueY,
  };
}

export interface SeriesBarProps {
  /** Key in data for bar height (y value) */
  dataKey: string;
  /** Fill color. Default: var(--chart-line-primary) */
  fill?: string;
  /** Tooltip dot color when fill is gradient/pattern. Default: fill */
  stroke?: string;
  /** Corner radius for bar top corners or capsule. Default: 0 */
  radius?: number;
  /** Whether to render a rounded dome head at top. Default: true when radius > 0 */
  roundedHead?: boolean;
  /** Whether to round bottom corners too (capsule/pill mode). Default: false */
  roundBottom?: boolean;
  /** Animate grow from baseline. Default: true */
  animate?: boolean;
  /** Opacity for non-hovered bars when another point is hovered (matches BarChart). Default: 0.3 */
  fadedOpacity?: number;
}

/**
 * Generates an SVG path with a rounded head (dome top corners) or capsule shape.
 */
export function getTopRoundedBarPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  roundBottom: boolean = false
): string {
  if (width <= 0 || height <= 0) return "";
  const maxR = Math.min(width / 2, height / (roundBottom ? 2 : 1));
  const r = Math.max(0, Math.min(radius, maxR));

  if (r <= 0.5) {
    return `M ${x} ${y} h ${width} v ${height} h ${-width} Z`;
  }

  if (roundBottom) {
    // Pill / capsule shape with both top and bottom fully rounded
    return (
      `M ${x} ${y + height - r} ` +
      `A ${r} ${r} 0 0 1 ${x + r} ${y + height} ` +
      `L ${x + width - r} ${y + height} ` +
      `A ${r} ${r} 0 0 1 ${x + width} ${y + height - r} ` +
      `L ${x + width} ${y + r} ` +
      `A ${r} ${r} 0 0 1 ${x + width - r} ${y} ` +
      `L ${x + r} ${y} ` +
      `A ${r} ${r} 0 0 1 ${x} ${y + r} ` +
      `Z`
    );
  }

  // Rounded head: top-left and top-right curved dome, bottom corners flat on baseline
  return (
    `M ${x} ${y + height} ` +
    `L ${x} ${y + r} ` +
    `A ${r} ${r} 0 0 1 ${x + r} ${y} ` +
    `L ${x + width - r} ${y} ` +
    `A ${r} ${r} 0 0 1 ${x + width} ${y + r} ` +
    `L ${x + width} ${y + height} ` +
    `Z`
  );
}

export function SeriesBar({
  dataKey,
  fill = chartCssVars.linePrimary,
  radius = 0,
  roundedHead = true,
  roundBottom = false,
  animate = true,
  fadedOpacity = 0.3,
}: SeriesBarProps) {
  const {
    data,
    xScale,
    yScale,
    xAccessor,
    innerHeight,
    innerWidth,
    columnWidth,
    isLoaded,
    animationDuration,
    enterTransition,
    revealEpoch = 0,
    barScale,
    composedBarDataKeys,
    composedBarSize,
    composedMaxBarSize,
    composedBarGap,
    composedStacked,
    composedStackOffsets,
    composedStackGap,
    tooltipData,
  } = useChart();

  const barKeys = useMemo(() => {
    if (composedBarDataKeys && composedBarDataKeys.length > 0) {
      return composedBarDataKeys;
    }
    return [dataKey];
  }, [composedBarDataKeys, dataKey]);

  const seriesIndex = useMemo(() => {
    const idx = barKeys.indexOf(dataKey);
    return idx >= 0 ? idx : 0;
  }, [barKeys, dataKey]);

  const n = barKeys.length;
  const gap = composedBarGap ?? 4;
  const stackGap = composedStackGap ?? 0;

  const stacked =
    Boolean(composedStacked) &&
    composedStackOffsets != null &&
    composedBarDataKeys != null &&
    composedBarDataKeys.length > 0;

  const isLastSeries = seriesIndex === n - 1;

  const barWidth = useMemo(
    () =>
      computeSeriesBarWidth({
        innerWidth,
        dataLength: data.length,
        columnWidth,
        seriesCount: n,
        composedBarSize,
        composedMaxBarSize,
        composedBarGap: gap,
        stacked,
      }),
    [
      columnWidth,
      composedBarSize,
      composedMaxBarSize,
      data.length,
      gap,
      innerWidth,
      n,
      stacked,
    ]
  );

  const totalAnimDuration = animationDuration || 1100;
  const staggerSpread = totalAnimDuration * 0.4;
  const calculatedStaggerDelay =
    data.length > 1 ? staggerSpread / 1000 / data.length : 0;
  const { hoveredIndex: legendHoveredIndex } = useChartLegendHover();
  const isLegendDimmed =
    legendHoveredIndex !== null && legendHoveredIndex !== seriesIndex;
  const hoveredIndex = tooltipData?.index ?? null;

  if (barScale) {
    console.warn(
      "SeriesBar is for time-based ComposedChart / LineChart context. Use Bar inside BarChart for categorical x."
    );
    return null;
  }

  return (
    <g className="series-bar">
      {data.map((d, i) => {
        const value = d[dataKey];
        if (typeof value !== "number") {
          return null;
        }

        const xCenter = xScale(xAccessor(d)) ?? 0;

        const { barLeft, valueY, barHeight, effectiveRadius } =
          computeSeriesBarLayout({
            stacked,
            composedStackOffsets,
            rowIndex: i,
            dataKey,
            value,
            yScale,
            innerHeight,
            xCenter,
            barWidth,
            seriesCount: n,
            gap,
            seriesIndex,
            stackGap,
            isLastSeries,
            radius,
          });

        const categoryLabel = String(xAccessor(d).getTime());
        const isFaded =
          (hoveredIndex !== null && hoveredIndex !== i) || isLegendDimmed;

        if (animate && !isLoaded) {
          return (
            <SeriesBarRect
              barHeight={barHeight}
              barWidth={barWidth}
              calculatedStaggerDelay={calculatedStaggerDelay}
              enterTransition={enterTransition}
              fadedOpacity={fadedOpacity}
              fill={fill}
              index={i}
              innerHeight={innerHeight}
              isFaded={isFaded}
              key={`${dataKey}-${categoryLabel}-${revealEpoch}`}
              radius={effectiveRadius}
              revealEpoch={revealEpoch}
              roundBottom={roundBottom}
              roundedHead={roundedHead}
              x={barLeft}
              y={valueY}
            />
          );
        }

        if (roundedHead && effectiveRadius > 0) {
          return (
            <motion.path
              animate={{ opacity: isFaded ? fadedOpacity : 1 }}
              d={getTopRoundedBarPath(
                barLeft,
                valueY,
                barWidth,
                barHeight,
                effectiveRadius,
                roundBottom
              )}
              fill={fill}
              key={`${dataKey}-${categoryLabel}`}
              transition={{ opacity: { duration: 0.12 } }}
            />
          );
        }

        return (
          <motion.rect
            animate={{ opacity: isFaded ? fadedOpacity : 1 }}
            fill={fill}
            height={barHeight}
            key={`${dataKey}-${categoryLabel}`}
            rx={effectiveRadius}
            ry={effectiveRadius}
            transition={{ opacity: { duration: 0.12 } }}
            width={barWidth}
            x={barLeft}
            y={valueY}
          />
        );
      })}
    </g>
  );
}

SeriesBar.displayName = "SeriesBar";

interface SeriesBarRectProps {
  x: number;
  y: number;
  barWidth: number;
  barHeight: number;
  fill: string;
  radius: number;
  index: number;
  innerHeight: number;
  calculatedStaggerDelay: number;
  enterTransition?: Transition;
  revealEpoch: number;
  isFaded: boolean;
  fadedOpacity: number;
  roundedHead?: boolean;
  roundBottom?: boolean;
}

function SeriesBarRect({
  x,
  y,
  barWidth,
  barHeight,
  fill,
  radius,
  index,
  innerHeight,
  calculatedStaggerDelay,
  enterTransition,
  revealEpoch,
  isFaded,
  fadedOpacity,
  roundedHead = true,
  roundBottom = false,
}: SeriesBarRectProps) {
  const enterAnim = transitionWithDelay(
    enterTransition,
    index * calculatedStaggerDelay
  );

  if (roundedHead && radius > 0) {
    return (
      <motion.g
        animate={{
          opacity: isFaded ? fadedOpacity : 1,
          scaleY: 1,
        }}
        initial={{ opacity: 0, scaleY: 0 }}
        key={`series-bar-${index}-${revealEpoch}`}
        style={{
          transformOrigin: `${x + barWidth / 2}px ${innerHeight}px`,
        }}
        transition={enterAnim}
      >
        <path
          d={getTopRoundedBarPath(
            x,
            y,
            barWidth,
            barHeight,
            radius,
            roundBottom
          )}
          fill={fill}
        />
      </motion.g>
    );
  }

  return (
    <motion.rect
      animate={{
        height: barHeight,
        y,
        opacity: isFaded ? fadedOpacity : 1,
      }}
      fill={fill}
      initial={{ height: 0, y: innerHeight, opacity: 1 }}
      key={`series-bar-${index}-${revealEpoch}`}
      rx={radius}
      ry={radius}
      transition={enterAnim}
      width={barWidth}
      x={x}
    />
  );
}

export default SeriesBar;
