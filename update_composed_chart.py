import sys

with open('components/Dashboard.tsx', 'r') as f:
    content = f.read()

import_old = "import { AreaChart, Area } from './charts/area-chart';"
import_new = """import { AreaChart, Area } from './charts/area-chart';
import { ComposedChart } from './charts/composed-chart';
import { Line } from './charts/line';"""

content = content.replace(import_old, import_new)

chart_old = """                                     <AreaChart
                                       data={mainChartData}
                                       xDataKey="date"
                                       animationDuration={1100}
                                       animationEasing="cubic-bezier(0.85, 0, 0.15, 1)"
                                     >
                                       <Grid horizontal />
                                     
                                       <ReferenceArea
                                         y1={chartStats.avg * 0.9}
                                         y2={chartStats.avg * 1.1}
                                         fill="color-mix(in oklch, var(--chart-foreground-muted) 15%, transparent)"
                                         fillOpacity={1}
                                         pattern="none"
                                         patternColor="var(--chart-foreground-muted)"
                                         stroke="var(--chart-foreground-muted)"
                                         strokeStyle="dashed"
                                         strokeDasharray="4,4"
                                         fadeEdges={true}
                                         fadeEdgesLength={10}
                                         axisLabelColor={themeStyles.chartAxis}
                                         showMarkers={true}
                                         markerColor={themeStyles.chartAxis}
                                       />
                                     
                                       <Area
                                         dataKey="value"
                                         curve={curveNatural}
                                         fillOpacity={0.3}
                                         strokeWidth={3}
                                         fill={trendColor}
                                         stroke={trendColor}
                                         fadeEdges
                                         gradientToOpacity={0}
                                         showLine
                                         showHighlight
                                       />
                                     
                                       {mainCompareAssets.map((asset, idx) => (
                                         <Area
                                           key={asset}
                                           dataKey={`compare_${idx}`}
                                           curve={curveNatural}
                                           fillOpacity={0.3}
                                           strokeWidth={2}
                                           fill={COMPARE_COLORS[idx]}
                                           stroke={COMPARE_COLORS[idx]}
                                           fadeEdges
                                           gradientToOpacity={0}
                                           showLine
                                           showHighlight
                                         />
                                       ))}
                                     
                                       <XAxis />
                                       <ChartTooltip />
                                     </AreaChart>"""

chart_new = """                                     <ComposedChart
                                       data={mainChartData}
                                       xDataKey="date"
                                       animationDuration={1100}
                                       animationEasing="cubic-bezier(0.85, 0, 0.15, 1)"
                                     >
                                       <Grid horizontal />
                                     
                                       <ReferenceArea
                                         y1={chartStats.avg * 0.9}
                                         y2={chartStats.avg * 1.1}
                                         fill="color-mix(in oklch, var(--chart-foreground-muted) 15%, transparent)"
                                         fillOpacity={1}
                                         pattern="none"
                                         patternColor="var(--chart-foreground-muted)"
                                         stroke="var(--chart-foreground-muted)"
                                         strokeStyle="dashed"
                                         strokeDasharray="4,4"
                                         fadeEdges={true}
                                         fadeEdgesLength={10}
                                         axisLabelColor={themeStyles.chartAxis}
                                         showMarkers={true}
                                         markerColor={themeStyles.chartAxis}
                                       />
                                     
                                       <Area
                                         dataKey="value"
                                         curve={curveNatural}
                                         fillOpacity={0.3}
                                         strokeWidth={3}
                                         fill={trendColor}
                                         stroke={trendColor}
                                         fadeEdges
                                         gradientToOpacity={0}
                                         showLine
                                         showHighlight
                                       />
                                     
                                       {mainCompareAssets.map((asset, idx) => (
                                         <Line
                                           key={asset}
                                           dataKey={`compare_${idx}`}
                                           curve={curveNatural}
                                           strokeWidth={2}
                                           stroke={COMPARE_COLORS[idx]}
                                           fadeEdges
                                           showHighlight
                                         />
                                       ))}
                                     
                                       <XAxis />
                                       <ChartTooltip />
                                     </ComposedChart>"""

content = content.replace(chart_old, chart_new)

with open('components/Dashboard.tsx', 'w') as f:
    f.write(content)
