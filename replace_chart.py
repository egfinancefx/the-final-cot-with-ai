import sys

with open('components/Dashboard.tsx', 'r') as f:
    content = f.read()

import_old = "import { XAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area, YAxis, PieChart, Pie, LineChart, Line, Cell, ComposedChart } from 'recharts';"
import_new = """import { YAxis, PieChart, Pie, LineChart, Line, Cell } from 'recharts';
import { AreaChart, Area } from './charts/area-chart';
import { Grid } from './charts/grid';
import { ReferenceArea } from './charts/reference-area';
import { XAxis } from './charts/x-axis';
import { ChartTooltip } from './charts/tooltip';
import { curveNatural } from '@visx/curve';"""

content = content.replace(import_old, import_new)

chart_old = """                                     <ResponsiveContainer width="100%" height="100%">
                                         <ComposedChart key={`main-chart-${selectedCommodity}`} data={mainChartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                                             <defs>
                                                 <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                     <stop offset="5%" stopColor={trendColor} stopOpacity={0.4}/>
                                                     <stop offset="95%" stopColor={trendColor} stopOpacity={0}/>
                                                 </linearGradient>
                                             </defs>
                                         <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.chartGrid} vertical={false} opacity={0.5} />
                                         <XAxis 
                                           dataKey="date" 
                                           stroke={themeStyles.chartAxis} 
                                           tick={{fontSize: 11, fill: themeStyles.chartAxis, fontWeight: 600}} 
                                           axisLine={{stroke: themeStyles.chartGrid}}
                                           tickLine={false}
                                           dy={10}
                                         />
                                         <YAxis 
                                             yAxisId="left"
                                             stroke={themeStyles.chartAxis} 
                                             tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} 
                                             tick={{fontSize: 11, fill: themeStyles.chartAxis, fontWeight: 600}}
                                             axisLine={false}
                                             tickLine={false}
                                             dx={-5}
                                         />
                                         {mainCompareAssets.length > 0 && (
                                           <YAxis 
                                               yAxisId="right"
                                               orientation="right"
                                               stroke={COMPARE_COLORS[0]} 
                                               tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} 
                                               tick={{fontSize: 11, fill: COMPARE_COLORS[0], fontWeight: 600}}
                                               axisLine={false}
                                               tickLine={false}
                                               dx={5}
                                           />
                                         )}
                                         <Tooltip 
                                           content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className={`backdrop-blur-xl border rounded-xl p-4 shadow-2xl min-w-[180px] ${themeMode === 'light' ? 'bg-white/95 border-slate-200' : 'bg-slate-900/95 border-blue-500/30'}`}>
                                                            <div className={`text-xs font-bold uppercase tracking-widest mb-2 border-b pb-2 ${themeMode === 'light' ? 'text-slate-500 border-slate-100' : 'text-slate-400 border-white/10'}`}>
                                                                {data.fullDate}
                                                            </div>
                                                            <div className="flex flex-col gap-2 mt-2">
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <span className={`text-sm font-medium ${themeMode === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>{selectedCommodity}</span>
                                                                    <span className={`text-sm font-mono font-bold ${data.value > 0 ? (themeMode === 'light' ? 'text-blue-600' : 'text-blue-400') : (themeMode === 'light' ? 'text-slate-600' : 'text-slate-200')}`}>
                                                                        {formatCurrency(data.value)}
                                                                    </span>
                                                                </div>
                                                                {mainCompareAssets.map((asset, idx) => (
                                                                  <div key={asset} className="flex items-center justify-between gap-4">
                                                                      <span className={`text-sm font-medium ${themeMode === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>{asset}</span>
                                                                      <span className={`text-sm font-mono font-bold`} style={{ color: COMPARE_COLORS[idx] }}>
                                                                          {formatCurrency(data[`compare_${idx}`])}
                                                                      </span>
                                                                  </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                           }}
                                         />
                                         <ReferenceLine y={0} yAxisId="left" stroke={themeStyles.chartAxis} strokeDasharray="3 3" opacity={0.3} strokeWidth={1} />
                                         <ReferenceLine y={chartStats.avg} yAxisId="left" stroke={trendColor} strokeDasharray="5 5" opacity={0.2} label={{ value: 'AVG', fill: trendColor, fontSize: 10, opacity: 0.5, position: 'insideRight' }} />
                                         <Area 
                                           key={`area-${selectedCommodity}`}
                                           yAxisId="left"
                                           type="monotone" 
                                           dataKey="value" 
                                           stroke={trendColor} 
                                           strokeWidth={3}
                                           fillOpacity={1} 
                                           fill="url(#colorValue)"
                                           activeDot={{ r: 6, fill: themeMode === 'light' ? '#fff' : '#0f172a', stroke: trendColor, strokeOpacity: 1, strokeWidth: 3 }}
                                           dot={renderCustomDot}
                                           isAnimationActive={true}
                                           animationDuration={1000}
                                         />
                                         {mainCompareAssets.map((asset, idx) => (
                                           <Line
                                             key={`line-${asset}-${selectedCommodity}`}
                                             yAxisId={mainCompareAssets.length > 0 ? "right" : "left"}
                                             type="monotone"
                                             dataKey={`compare_${idx}`}
                                             stroke={COMPARE_COLORS[idx]}
                                             strokeWidth={3}
                                             dot={false}
                                             activeDot={{ r: 6, fill: themeMode === 'light' ? '#fff' : '#0f172a', stroke: COMPARE_COLORS[idx], strokeWidth: 3 }}
                                             isAnimationActive={true}
                                             animationDuration={1000}
                                           />
                                         ))}
                                     </ComposedChart>
                                 </ResponsiveContainer>"""

chart_new = """                                     <AreaChart
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

content = content.replace(chart_old, chart_new)

with open('components/Dashboard.tsx', 'w') as f:
    f.write(content)
