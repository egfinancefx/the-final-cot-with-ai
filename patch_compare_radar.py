import sys

with open('components/CompareView.tsx', 'r') as f:
    content = f.read()

# Add imports
imports = """import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
         Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';"""

new_imports = """import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
         Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { RadarChart, RadarGrid, RadarAxis, RadarLabels, RadarArea } from './charts/radar-chart';"""

content = content.replace(imports, new_imports)

# Add radarData useMemo
hooks_anchor = "const { historicalBarsData, normalizedTrajectoryData, flowDeltaData } = useMemo(() => {"
new_hooks = """
  const radarMetrics = useMemo(() => [
    { key: "long", label: "قوة الشراء" },
    { key: "short", label: "قوة البيع" },
    { key: "net", label: "كثافة التمركز" },
    { key: "momentum", label: "زخم التغير" },
    { key: "control", label: "السيطرة" }
  ], []);

  const radarData = useMemo(() => {
    let maxLong = 1;
    let maxShort = 1;
    let maxNet = 1;
    let maxMomentum = 1;

    processedAssets.forEach(p => {
      maxLong = Math.max(maxLong, Math.abs(p.longPos));
      maxShort = Math.max(maxShort, Math.abs(p.shortPos));
      maxNet = Math.max(maxNet, Math.abs(p.netPos));
      maxMomentum = Math.max(maxMomentum, Math.abs(p.netChange));
    });

    return processedAssets.map(p => {
      const controlScore = p.totalPositions > 0 ? (p.longPos / p.totalPositions) * 100 : 50;
      return {
        label: p.asset,
        color: p.color,
        values: {
          long: (Math.abs(p.longPos) / maxLong) * 100,
          short: (Math.abs(p.shortPos) / maxShort) * 100,
          net: (Math.abs(p.netPos) / maxNet) * 100,
          momentum: (Math.abs(p.netChange) / maxMomentum) * 100,
          control: controlScore
        }
      };
    });
  }, [processedAssets]);

  const { historicalBarsData, normalizedTrajectoryData, flowDeltaData } = useMemo(() => {"""

content = content.replace(hooks_anchor, new_hooks)

# Add type to useState
state_anchor = "const [chartView, setChartView] = useState<'normalized' | 'historical' | 'delta'>('normalized');"
new_state = "const [chartView, setChartView] = useState<'normalized' | 'historical' | 'delta' | 'radar'>('radar');"
content = content.replace(state_anchor, new_state)

# Add button
button_anchor = """              <button
                onClick={() => setChartView('normalized')}"""
new_button = """              <button
                onClick={() => setChartView('radar')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  chartView === 'radar'
                    ? isLight
                      ? 'bg-white text-blue-700 shadow-sm font-black'
                      : 'bg-blue-600 text-white shadow-sm font-black'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-blue-200/70 hover:text-white'
                }`}
              >
                الرادار الهيكلي
              </button>
              <button
                onClick={() => setChartView('normalized')}"""
content = content.replace(button_anchor, new_button)

# Add chart view
chart_anchor = """            {chartView === 'delta' && (
              <div className="w-full h-full flex flex-col">"""
new_chart = """            {chartView === 'radar' && (
              <div className="w-full h-full flex flex-col items-center justify-center relative">
                <div className={`absolute top-0 right-0 left-0 text-xs text-center ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  خريطة رادارية متقدمة لتفكيك مكامن القوة المؤسسية بين الأصول
                </div>
                <div className="flex-1 w-full flex items-center justify-center pt-6">
                  <RadarChart data={radarData} metrics={radarMetrics} size={340} margin={60}>
                    <RadarGrid showLabels={false} />
                    <RadarAxis />
                    <RadarLabels fontSize={12} offset={24} />
                    {radarData.map((item, index) => (
                      <RadarArea key={item.label} index={index} showPoints={true} showGlow={true} />
                    ))}
                  </RadarChart>
                </div>
              </div>
            )}
            {chartView === 'delta' && (
              <div className="w-full h-full flex flex-col">"""
content = content.replace(chart_anchor, new_chart)

with open('components/CompareView.tsx', 'w') as f:
    f.write(content)
