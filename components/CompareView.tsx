import React, { useState, useMemo } from 'react';
import { SummaryRow, HistoryRow, ThemeMode } from '../types';
import { 
  ArrowLeft, TrendingUp, TrendingDown, Activity, PieChart as PieChartIcon, 
  Scale, ShieldAlert, Zap, BarChart3, Layers, Award, CheckCircle2, 
  Sparkles, Target, AlertTriangle, ArrowRight, Info, Compass
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, ReferenceLine 
} from 'recharts';
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

// Distinct modern color palette (Strictly NO green or red!)
// Asset 0: Vibrant Blue | Asset 1: Bright Cyan | Asset 2: Indigo
const ASSET_COLORS = ['#3b82f6', '#06b6d4', '#818cf8'];

// Flow archetype classifier
interface FlowClassification {
  type: string;
  title: string;
  subtitle: string;
  badge: string;
  actionableHint: string;
  isBullishLeading: boolean;
}

const classifyFlow = (longChange: number, shortChange: number): FlowClassification => {
  if (longChange > 0 && shortChange <= 0) {
    return {
      type: 'bullish_aggressive',
      title: 'شراء حقيقي نشط وتغطية بيعية',
      subtitle: 'دخول سيولة شرائية جديدة بالتزامن مع إغلاق عقود بيعية (أقوى درجات الزخم الإيجابي)',
      badge: 'تجميع مؤسسي قوي',
      actionableHint: 'دعم قوي لاستمرار الصعود مع وقود إضافي من تخارج البائعين',
      isBullishLeading: true,
    };
  } else if (longChange > 0 && shortChange > 0) {
    if (longChange >= shortChange) {
      return {
        type: 'bullish_expansion',
        title: 'توسع كلي في المراكز (تفوق الشراء)',
        subtitle: 'ارتفاع إجمالي الفائدة المفتوحة مع ضخ عقود شراء تفوق وتيرة البيع',
        badge: 'توسع شرائي',
        actionableHint: 'اهتمام مؤسسي متصاعد وزخم شرائي متفوق',
        isBullishLeading: true,
      };
    } else {
      return {
        type: 'bearish_expansion',
        title: 'توسع كلي في المراكز (تفوق البيع)',
        subtitle: 'ارتفاع إجمالي الفائدة المفتوحة مع تمركز عقود بيع جديدة تفوق وتيرة الشراء',
        badge: 'توسع بيعي',
        actionableHint: 'ضغوط بيعية مستمرة رغم وجود بعض المشتريات',
        isBullishLeading: false,
      };
    }
  } else if (longChange <= 0 && shortChange < 0) {
    return {
      type: 'short_covering',
      title: 'تغطية بيعية بحتة (Short Covering)',
      subtitle: 'ارتفاع ناتج عن جني أرباح البائعين وإغلاق صفقاتهم دون دخول مشترين حقيقيين',
      badge: 'إغلاق شورت',
      actionableHint: 'صعود هش محتمل؛ لا توجد سيولة شرائية جديدة تدعمه',
      isBullishLeading: false,
    };
  } else if (longChange < 0 && shortChange > 0) {
    return {
      type: 'bearish_aggressive',
      title: 'تصريف شرائي وضغط بيع هجومي',
      subtitle: 'تصفية واضحة لمراكز الشراء بالتزامن مع فتح مراكز بيعية جديدة قوية',
      badge: 'تصريف هبوطي حاد',
      actionableHint: 'إشارة سلبية واضحة؛ خروج مؤسسي صريح من مراكز الشراء',
      isBullishLeading: false,
    };
  } else if (longChange < 0 && shortChange <= 0) {
    return {
      type: 'long_liquidation',
      title: 'تسييل مراكز شراء (Long Liquidation)',
      subtitle: 'جني أرباح وتراجع في شهية المخاطرة دون بناء مراكز بيع هجومية جديدة',
      badge: 'جني أرباح شراء',
      actionableHint: 'ضغط هبوطي ناتج عن الإغلاقات وليس عن سيولة بيعية جديدة',
      isBullishLeading: false,
    };
  } else {
    return {
      type: 'neutral',
      title: 'توازن واستقرار نسبي',
      subtitle: 'حركة ضيقة في تغيرات العقود دون تغيير هيكلي ملحوظ في التمركزات',
      badge: 'تمركز متوازن',
      actionableHint: 'السوق في مرحلة ترقب وبناء مراكز غير معلنة',
      isBullishLeading: false,
    };
  }
};

const CompareView: React.FC<CompareViewProps> = ({
  assets,
  summaryData,
  historyData,
  historyDates,
  themeMode,
  onBack,
}) => {
  const [chartView, setChartView] = useState<'normalized' | 'historical' | 'delta'>('normalized');
  const isLight = themeMode === 'light';

  // Base Theme styling
  const themeStyles = {
    bg: isLight ? 'bg-white' : 'bg-[#0a1120]',
    cardBg: isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f1d36]/90 border-blue-500/20',
    panelBg: isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0c172e] border-blue-500/25 shadow-xl',
    border: isLight ? 'border-slate-200' : 'border-blue-500/20',
    textMain: isLight ? 'text-slate-900' : 'text-white',
    textSub: isLight ? 'text-slate-500' : 'text-blue-200/70',
    headerGlow: isLight ? 'from-blue-50 to-indigo-50/40' : 'from-blue-950/40 via-slate-900/60 to-transparent',
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Comprehensive processed metrics for each asset
  const processedAssets = useMemo(() => {
    return assets.map((asset, index) => {
      const summaryRow = summaryData.find((s) => s.Commodity === asset);
      const historyRow = historyData.find((h) => h.Commodity === asset);

      const netPos = summaryRow ? summaryRow['Net Positions'] || 0 : 0;
      const netChange = summaryRow ? summaryRow['Net Change'] || 0 : 0;
      const longPos = summaryRow ? summaryRow['Long Positions'] || 0 : 0;
      const longChange = summaryRow ? summaryRow['Long Change'] || 0 : 0;
      const shortPos = summaryRow ? summaryRow['Short Positions'] || 0 : 0;
      const shortChange = summaryRow ? summaryRow['Short Change'] || 0 : 0;

      const totalPositions = longPos + shortPos;
      const longRatio = totalPositions > 0 ? (longPos / totalPositions) * 100 : 50;
      const shortRatio = totalPositions > 0 ? (shortPos / totalPositions) * 100 : 50;
      const netRatio = totalPositions > 0 ? ((longPos - shortPos) / totalPositions) * 100 : 0;

      // Extract historical net values
      const historyValues = historyDates.map((d) => (historyRow ? Number(historyRow[d]) || 0 : 0));
      const minNet = historyValues.length > 0 ? Math.min(...historyValues) : 0;
      const maxNet = historyValues.length > 0 ? Math.max(...historyValues) : 0;
      
      // COT Index (Percentile across the historical period: 0% to 100%)
      const cotIndex = maxNet !== minNet ? ((netPos - minNet) / (maxNet - minNet)) * 100 : 50;

      // 4-Week Net Flow
      const fourWeekNetDelta =
        historyValues.length >= 4 ? historyValues[0] - historyValues[Math.min(3, historyValues.length - 1)] : netChange;

      // Flow Quality Classification
      const flow = classifyFlow(longChange, shortChange);

      // Overcrowding Warning
      const isOvercrowdedLong = longRatio >= 72 || cotIndex >= 85;
      const isOvercrowdedShort = shortRatio >= 72 || cotIndex <= 15;

      // Institutional Conviction Score (-100 to +100)
      // Combines current net ratio (50%), COT Index deviation (30%), and weekly momentum direction (20%)
      const momentumBonus = netChange > 0 ? 15 : netChange < 0 ? -15 : 0;
      const convictionScore = Math.round(
        netRatio * 0.5 + (cotIndex - 50) * 0.6 + momentumBonus
      );

      return {
        asset,
        index,
        color: ASSET_COLORS[index % ASSET_COLORS.length],
        symbol: TV_SYMBOL_MAP[asset] || asset,
        netPos,
        netChange,
        longPos,
        longChange,
        shortPos,
        shortChange,
        totalPositions,
        longRatio,
        shortRatio,
        netRatio,
        historyValues,
        minNet,
        maxNet,
        cotIndex,
        fourWeekNetDelta,
        flow,
        isOvercrowdedLong,
        isOvercrowdedShort,
        convictionScore,
      };
    });
  }, [assets, summaryData, historyData, historyDates]);

  // Historical Charts Data
  const { historicalBarsData, normalizedTrajectoryData, flowDeltaData } = useMemo(() => {
    // 1. Normalized Trajectory (% Net of Total over history dates)
    const normData = historyDates.map((date) => {
      const point: any = { 
        date: date.split(',')[0], 
        fullDate: date 
      };
      processedAssets.forEach((item) => {
        const historyRow = historyData.find((h) => h.Commodity === item.asset);
        const netVal = historyRow ? Number(historyRow[date]) || 0 : 0;
        // Normalized against total positions or max historical range
        const baseTotal = item.totalPositions > 0 ? item.totalPositions : Math.max(Math.abs(item.minNet), Math.abs(item.maxNet)) || 1;
        const normScore = Math.max(-100, Math.min(100, (netVal / baseTotal) * 100));
        point[`norm_${item.index}`] = Number(normScore.toFixed(1));
        point[`raw_${item.index}`] = netVal;
      });
      return point;
    }).reverse();

    // 2. Historical Raw Bars Data
    const rawData = historyDates.map((date) => {
      const point: any = { date: date.split(',')[0], fullDate: date };
      processedAssets.forEach((item) => {
        const historyRow = historyData.find((h) => h.Commodity === item.asset);
        point[`asset_${item.index}`] = historyRow ? Number(historyRow[date]) || 0 : 0;
      });
      return point;
    }).reverse();

    // 3. Flow Delta Data for Long vs Short changes
    const deltaData = processedAssets.map((item) => ({
      name: item.asset,
      symbol: item.symbol,
      longChange: item.longChange,
      shortChange: item.shortChange,
      netChange: item.netChange,
      color: item.color,
    }));

    return { 
      historicalBarsData: rawData, 
      normalizedTrajectoryData: normData,
      flowDeltaData: deltaData 
    };
  }, [historyDates, processedAssets, historyData]);

  // Synthesis & Pair Opportunity Analysis
  const synthesis = useMemo(() => {
    if (processedAssets.length === 0) return null;

    // Sort by conviction score descending (Rank 1 is strongest)
    const ranked = [...processedAssets].sort((a, b) => b.convictionScore - a.convictionScore);
    const strongest = ranked[0];
    const weakest = ranked[ranked.length - 1];

    if (processedAssets.length === 2) {
      const [assetA, assetB] = processedAssets;
      const scoreDiff = assetA.convictionScore - assetB.convictionScore;
      const netRatioSpread = assetA.netRatio - assetB.netRatio;
      const weeklyFlowSpread = assetA.netChange - assetB.netChange;

      let pairVerdict = '';
      let tradeBias = '';
      let confidenceLevel: 'high' | 'medium' | 'moderate' = 'medium';

      if (scoreDiff > 25) {
        tradeBias = `شراء ${assetA.asset} مقابل بيع ${assetB.asset} (Long ${assetA.symbol} / Short ${assetB.symbol})`;
        pairVerdict = `تظهر البيانات تفوقاً مؤسسياً حاسماً لصالح ${assetA.asset}، مدعوماً بتدفقات سيولة صافية ونسبة شراء تفوق ${assetB.asset} بفارق ${Math.abs(Math.round(netRatioSpread))} نقطة مئوية.`;
        confidenceLevel = 'high';
      } else if (scoreDiff < -25) {
        tradeBias = `شراء ${assetB.asset} مقابل بيع ${assetA.asset} (Long ${assetB.symbol} / Short ${assetA.symbol})`;
        pairVerdict = `تظهر البيانات تفوقاً مؤسسياً حاسماً لصالح ${assetB.asset}، مدعوماً بتدفقات سيولة صافية ونسبة شراء تفوق ${assetA.asset} بفارق ${Math.abs(Math.round(netRatioSpread))} نقطة مئوية.`;
        confidenceLevel = 'high';
      } else {
        if (assetA.netRatio > 0 && assetB.netRatio > 0) {
          tradeBias = `تحالف شرائي صاعد (Bullish Tandem / Long Bias)`;
          pairVerdict = `كلا الأصلين يحظيان بتمركزات شراء إيجابية من كبار المضاربين؛ الأفضلية للمضاربة مع الاتجاه العام دون صفقات عكسية متضاربة.`;
          confidenceLevel = 'moderate';
        } else if (assetA.netRatio < 0 && assetB.netRatio < 0) {
          tradeBias = `ضغوط تصريف مشتركة (Bearish Tandem / Short Bias)`;
          pairVerdict = `كلا الأصلين يعانيان من تمركزات بيعية صافية وتفريغ عقود؛ تجنب الشراء المعاكس حتى ظهور بوادر تجميع مؤسسي.`;
          confidenceLevel = 'moderate';
        } else {
          tradeBias = `تمركزات متقاربة / توازن نسبي`;
          pairVerdict = `الفارق المؤسسي بين الأصلين ضئيل حالياً؛ ينصح بانتظار بيانات الأسبوع القادم لتأكيد كسر الاتجاه وتحديد الطرف المسيطر.`;
          confidenceLevel = 'moderate';
        }
      }

      // Check divergence
      const hasDivergence =
        (assetA.netChange > 0 && assetB.netChange < 0) ||
        (assetA.netChange < 0 && assetB.netChange > 0);

      return {
        isTwoAssets: true,
        ranked,
        strongest,
        weakest,
        pairVerdict,
        tradeBias,
        confidenceLevel,
        scoreDiff,
        netRatioSpread,
        weeklyFlowSpread,
        hasDivergence,
      };
    } else {
      // 3 Assets
      const scoreSpread = strongest.convictionScore - weakest.convictionScore;
      const topPairBias = `شراء المتصدر [${strongest.asset}] مقابل بيع الأضعف [${weakest.asset}]`;
      const verdict = `من بين الأصول الثلاثة محل المقارنة، يتربع ${strongest.asset} في قمة التفضيل المؤسسي بقوة شرائية وتدفقات مستمرة، بينما يقع ${weakest.asset} في أدنى درجات التحيز نتيجة ضغوط بيعية أو تفريغ مراكز. هذا التباين يخلق فرصة انتشار زوجي (Spread Pair Trade) عالية الدقة.`;

      return {
        isTwoAssets: false,
        ranked,
        strongest,
        weakest,
        tradeBias: topPairBias,
        pairVerdict: verdict,
        scoreSpread,
        confidenceLevel: scoreSpread > 35 ? ('high' as const) : ('medium' as const),
      };
    }
  }, [processedAssets]);

  return (
    <div className={`flex flex-col h-full overflow-y-auto pb-16 custom-scrollbar ${themeStyles.bg}`}>
      {/* Top Header Bar */}
      <div className={`p-4 sm:p-6 border-b ${themeStyles.border} bg-gradient-to-r ${themeStyles.headerGlow}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isLight
                  ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
                  : 'bg-blue-900/30 border border-blue-500/30 text-cyan-300 hover:bg-blue-800/40 shadow-sm'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-500" />
                <h1 className={`text-xl sm:text-2xl font-black ${themeStyles.textMain}`}>
                  التحليل المؤسسي المقارن المتقدم
                </h1>
              </div>
              <p className={`text-xs mt-0.5 ${themeStyles.textSub}`}>
                مقارنة تفاعلية مبنية على بيانات تقرير التزام كبار المتداولين (COT) وتفكيك تدفقات السيولة الذكية
              </p>
            </div>
          </div>

          {/* Selected Assets Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {processedAssets.map((item) => (
              <div
                key={item.asset}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-sm ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800'
                    : 'bg-slate-900/90 border-blue-500/30 text-white'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                <span>{item.asset}</span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                  isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-blue-200'
                }`}>
                  {item.symbol}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-8 max-w-[1600px] mx-auto w-full">
        {/* TradingView Charts Grid (Preserved exactly as requested) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${themeStyles.textMain}`}>
              <Activity className="w-4 h-4 text-blue-500" />
              الرسوم البيانية الحية (TradingView Live Price Charts)
            </h3>
            <span className={`text-xs ${themeStyles.textSub}`}>
              حركة السعر المباشرة للأصول المقارنة
            </span>
          </div>

          <div
            className={`grid gap-4 ${
              assets.length === 3 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'
            }`}
          >
            {assets.map((asset, index) => (
              <div
                key={asset}
                className={`flex flex-col rounded-2xl border overflow-hidden ${themeStyles.bg} ${themeStyles.border} shadow-lg`}
                style={{ height: '400px' }}
              >
                <div className={`px-4 py-2.5 border-b flex items-center justify-between ${themeStyles.border}`}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ASSET_COLORS[index % ASSET_COLORS.length] }}
                    />
                    <h4 className={`font-bold text-sm ${themeStyles.textMain}`}>{asset}</h4>
                  </div>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded ${
                      isLight ? 'bg-slate-100 text-slate-700 font-bold' : 'bg-slate-800 text-cyan-300 font-bold'
                    }`}
                  >
                    {TV_SYMBOL_MAP[asset] || asset}
                  </span>
                </div>
                <div className="flex-1 w-full">
                  <TradingViewWidget
                    symbol={TV_SYMBOL_MAP[asset] || 'OANDA:XAUUSD'}
                    themeMode={themeMode}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 1. The Core Institutional Verdict & Actionable Trade Synthesis Panel */}
        {synthesis && (
          <div
            className={`rounded-3xl border p-5 sm:p-7 relative overflow-hidden transition-all duration-300 ${
              isLight
                ? 'bg-gradient-to-br from-blue-50/90 via-white to-slate-50 border-blue-200 shadow-md'
                : 'bg-gradient-to-br from-[#0c1833] via-[#091122] to-[#0a1529] border-blue-500/30 shadow-[0_0_35px_-10px_rgba(59,130,246,0.3)]'
            }`}
          >
            {/* Ambient Background Blur Spot */}
            <div className="absolute -top-16 -left-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-5">
              {/* Header of Synthesis */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-blue-500/20">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-cyan-300'}`}>
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-base sm:text-lg font-black ${themeStyles.textMain}`}>
                      الخلاصة التحليلية وقرار المقارنة المؤسسي (Actionable Intelligence Verdict)
                    </h3>
                    <p className={`text-xs ${themeStyles.textSub}`}>
                      استنتاج تحليلي مباشر من تفكيك وتطابق تمركزات كبار المضاربين وصناديق التحوط
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${themeStyles.textSub}`}>درجة دقة الإشارة:</span>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black tracking-wide border ${
                      synthesis.confidenceLevel === 'high'
                        ? isLight
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-blue-500/25 text-cyan-300 border-blue-500/40 shadow-sm'
                        : isLight
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-slate-800 text-slate-200 border-slate-700'
                    }`}
                  >
                    {synthesis.confidenceLevel === 'high' ? 'قوة مؤسسية عالية (High Alpha)' : 'إشارة معتدلة (Moderate)'}
                  </span>
                </div>
              </div>

              {/* Actionable Strategy Box */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">
                <div className="lg:col-span-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
                      التوصية المؤسسية المستخلصة
                    </span>
                  </div>

                  <div className={`text-base sm:text-lg font-black tracking-tight leading-snug ${themeStyles.textMain}`}>
                    {synthesis.tradeBias}
                  </div>

                  <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-blue-100/80'}`}>
                    {synthesis.pairVerdict}
                  </p>
                </div>

                {/* Score or Ranking Pillar */}
                <div className={`p-4 rounded-2xl border ${themeStyles.cardBg} flex flex-col justify-center gap-3`}>
                  {synthesis.isTwoAssets ? (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-500">فارق القوة النسبية:</span>
                        <span className={`font-mono font-black ${themeStyles.textMain}`}>
                          {Math.abs(synthesis.scoreDiff)} نقطة
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-500">فارق صافي العقود الأسبوعي:</span>
                        <span className={`font-mono font-black ${themeStyles.textMain}`}>
                          {synthesis.weeklyFlowSpread > 0 ? `+${formatCurrency(synthesis.weeklyFlowSpread)}` : formatCurrency(synthesis.weeklyFlowSpread)} عقد
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-500">حالة التباين (Divergence):</span>
                        <span className={`font-black ${synthesis.hasDivergence ? (isLight ? 'text-blue-600' : 'text-cyan-300') : themeStyles.textSub}`}>
                          {synthesis.hasDivergence ? 'تباين صريح في التدفقات' : 'تدفقات متوافقة'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs font-black mb-1 text-blue-500">ترتيب الأصول حسب القوة المؤسسية:</div>
                      {synthesis.ranked.map((item, rIdx) => (
                        <div key={item.asset} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                              rIdx === 0 
                                ? isLight ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' 
                                : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {rIdx + 1}
                            </span>
                            <span className={`font-bold ${themeStyles.textMain}`}>{item.asset}</span>
                          </div>
                          <span className={`font-mono font-bold ${rIdx === 0 ? (isLight ? 'text-blue-600' : 'text-cyan-300') : themeStyles.textSub}`}>
                            {item.convictionScore > 0 ? `+${item.convictionScore}` : item.convictionScore} نقطة
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Side-by-Side Deep Institutional Intelligence Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-base font-black flex items-center gap-2 ${themeStyles.textMain}`}>
              <Layers className="w-5 h-5 text-blue-500" />
              التشريح المؤسسي المتعمق لكل أصل (Institutional Asset Breakdown)
            </h3>
            <span className={`text-xs ${themeStyles.textSub}`}>
              تفاصيل السيولة الحقيقية، مؤشر COT النسبي، وتشخيص جودة التدفقات
            </span>
          </div>

          <div
            className={`grid gap-5 ${
              processedAssets.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'
            }`}
          >
            {processedAssets.map((item) => (
              <div
                key={item.asset}
                className={`rounded-3xl border p-5 sm:p-6 transition-all duration-300 hover:shadow-xl relative flex flex-col justify-between ${
                  themeStyles.panelBg
                }`}
              >
                {/* Card Header */}
                <div className="space-y-3 pb-4 border-b border-blue-500/15">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                      <div>
                        <h4 className={`text-lg font-black ${themeStyles.textMain}`}>{item.asset}</h4>
                        <span className={`text-xs font-mono font-bold ${isLight ? 'text-blue-700' : 'text-cyan-300'}`}>
                          {item.symbol}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`px-3 py-1 rounded-xl text-xs font-black border ${
                        item.netPos >= 0
                          ? isLight
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-blue-500/20 text-cyan-300 border-blue-500/30'
                          : isLight
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : 'bg-white/10 text-white border-white/20'
                      }`}
                    >
                      {item.netPos >= 0 ? 'صافي شرائي (Bullish)' : 'صافي بيعي (Bearish)'}
                    </div>
                  </div>

                  {/* Flow Quality Banner */}
                  <div
                    className={`p-3 rounded-2xl border text-xs space-y-1 ${
                      item.flow.isBullishLeading
                        ? isLight
                          ? 'bg-blue-50/70 border-blue-200 text-slate-800'
                          : 'bg-blue-950/40 border-blue-500/30 text-blue-100'
                        : isLight
                        ? 'bg-slate-100/70 border-slate-200 text-slate-800'
                        : 'bg-slate-900/80 border-slate-700 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-blue-500" />
                        {item.flow.title}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        item.flow.isBullishLeading 
                          ? isLight ? 'bg-blue-200 text-blue-900' : 'bg-blue-500/30 text-cyan-300' 
                          : isLight ? 'bg-slate-300 text-slate-800' : 'bg-white/20 text-white'
                      }`}>
                        {item.flow.badge}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">{item.flow.subtitle}</p>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="py-4 space-y-4">
                  {/* Long vs Short Dual Meter */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-mono font-bold">
                      <span className={`flex items-center gap-1 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`}>
                        <span>{item.longRatio.toFixed(1)}%</span>
                        <span className="text-[10px] opacity-75">شراء</span>
                      </span>
                      <span className={`flex items-center gap-1 ${isLight ? 'text-slate-600' : 'text-white'}`}>
                        <span className="text-[10px] opacity-75">بيع</span>
                        <span>{item.shortRatio.toFixed(1)}%</span>
                      </span>
                    </div>
                    <div className={`h-2.5 w-full rounded-full overflow-hidden flex p-0.5 border ${
                      isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-950 border-blue-900/40'
                    }`}>
                      <div 
                        className="h-full rounded-r-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500 shadow-sm"
                        style={{ width: `${item.longRatio}%` }}
                      />
                      <div 
                        className={`h-full rounded-l-full transition-all duration-500 shadow-sm ${
                          isLight ? 'bg-gradient-to-r from-slate-400 to-slate-600' : 'bg-gradient-to-r from-slate-300 to-white'
                        }`}
                        style={{ width: `${item.shortRatio}%` }}
                      />
                    </div>
                  </div>

                  {/* 4-Cell Key Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-2xl border ${themeStyles.cardBg}`}>
                      <div className={`text-[11px] font-bold ${themeStyles.textSub}`}>صافي العقود الحالي</div>
                      <div className={`text-base font-black font-mono mt-0.5 ${
                        item.netPos >= 0 
                          ? isLight ? 'text-blue-600' : 'text-cyan-400' 
                          : isLight ? 'text-slate-800' : 'text-white'
                      }`}>
                        {item.netPos > 0 ? `+${formatCurrency(item.netPos)}` : formatCurrency(item.netPos)}
                      </div>
                    </div>

                    <div className={`p-3 rounded-2xl border ${themeStyles.cardBg}`}>
                      <div className={`text-[11px] font-bold ${themeStyles.textSub}`}>التغير الأسبوعي الصافي</div>
                      <div className={`text-base font-black font-mono mt-0.5 ${
                        item.netChange >= 0 
                          ? isLight ? 'text-blue-600' : 'text-cyan-400' 
                          : isLight ? 'text-slate-800' : 'text-white'
                      }`}>
                        {item.netChange > 0 ? `+${formatCurrency(item.netChange)}` : formatCurrency(item.netChange)}
                      </div>
                    </div>

                    <div className={`p-3 rounded-2xl border ${themeStyles.cardBg}`}>
                      <div className={`text-[11px] font-bold ${themeStyles.textSub}`}>التدفق التراكمي (4 أسابيع)</div>
                      <div className={`text-base font-black font-mono mt-0.5 ${
                        item.fourWeekNetDelta >= 0 
                          ? isLight ? 'text-blue-600' : 'text-cyan-400' 
                          : isLight ? 'text-slate-800' : 'text-white'
                      }`}>
                        {item.fourWeekNetDelta > 0 ? `+${formatCurrency(item.fourWeekNetDelta)}` : formatCurrency(item.fourWeekNetDelta)}
                      </div>
                    </div>

                    <div className={`p-3 rounded-2xl border ${themeStyles.cardBg}`}>
                      <div className={`text-[11px] font-bold ${themeStyles.textSub}`}>مؤشر COT النسبي</div>
                      <div className={`text-base font-black font-mono mt-0.5 ${
                        isLight ? 'text-blue-700' : 'text-cyan-300'
                      }`}>
                        {item.cotIndex.toFixed(0)}%
                        <span className={`text-[10px] font-normal mr-1 ${themeStyles.textSub}`}>(نطاق 6 أسابيع)</span>
                      </div>
                    </div>
                  </div>

                  {/* Overcrowding Risk Alert */}
                  {(item.isOvercrowdedLong || item.isOvercrowdedShort) && (
                    <div className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs font-bold ${
                      isLight 
                        ? 'bg-blue-100/90 text-blue-900 border-blue-300' 
                        : 'bg-cyan-950/40 text-cyan-200 border-cyan-400/40 shadow-sm'
                    }`}>
                      <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
                      <span>
                        {item.isOvercrowdedLong 
                          ? 'تحذير تشبع شرائي حاد: مراكز الشراء عند قمم تاريخية؛ احتمالية ارتداد تصحيحي.' 
                          : 'تحذير تشبع بيعي مفرط: تكدس بيعي حاد؛ احتمالية حدوث Short Squeeze مفاجئ.'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Detail Breakdown */}
                <div className={`pt-3 border-t border-blue-500/15 flex items-center justify-between text-xs ${themeStyles.textSub}`}>
                  <div>
                    <span>إجمالي العقود: </span>
                    <span className={`font-mono font-bold ${themeStyles.textMain}`}>{formatCurrency(item.totalPositions)}</span>
                  </div>
                  <div>
                    <span>نسبة الصافي: </span>
                    <span className={`font-mono font-bold ${item.netRatio >= 0 ? (isLight ? 'text-blue-600' : 'text-cyan-400') : (isLight ? 'text-slate-800' : 'text-white')}`}>
                      {item.netRatio > 0 ? `+${item.netRatio.toFixed(1)}%` : `${item.netRatio.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Advanced Comparison Charts Section */}
        <div className={`rounded-3xl border p-5 sm:p-7 shadow-xl ${themeStyles.panelBg}`}>
          {/* Chart Header with Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b pb-4 border-blue-500/15">
            <div>
              <h3 className={`text-base sm:text-lg font-black flex items-center gap-2 ${themeStyles.textMain}`}>
                <BarChart3 className="w-5 h-5 text-blue-500" />
                استوديو الرسوم البيانية المقارنة المتقدمة (Comparative Analytical Studio)
              </h3>
              <p className={`text-xs mt-0.5 ${themeStyles.textSub}`}>
                تتبع مسارات القوة النسبية، تطور صافي العقود، وتشريح تدفقات الدخول والخروج الأسبوعية
              </p>
            </div>

            {/* View Selector Tabs */}
            <div className={`flex items-center p-1 rounded-2xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-blue-500/30'}`}>
              <button
                onClick={() => setChartView('normalized')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  chartView === 'normalized'
                    ? isLight
                      ? 'bg-white text-blue-700 shadow-sm font-black'
                      : 'bg-blue-600 text-white shadow-sm font-black'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-blue-200/70 hover:text-white'
                }`}
              >
                مؤشر القوة المعياري (-100% إلى +100%)
              </button>
              <button
                onClick={() => setChartView('historical')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  chartView === 'historical'
                    ? isLight
                      ? 'bg-white text-blue-700 shadow-sm font-black'
                      : 'bg-blue-600 text-white shadow-sm font-black'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-blue-200/70 hover:text-white'
                }`}
              >
                صافي العقود التاريخية
              </button>
              <button
                onClick={() => setChartView('delta')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  chartView === 'delta'
                    ? isLight
                      ? 'bg-white text-blue-700 shadow-sm font-black'
                      : 'bg-blue-600 text-white shadow-sm font-black'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-blue-200/70 hover:text-white'
                }`}
              >
                تشريح تدفقات الدخول/الخروج
              </button>
            </div>
          </div>

          {/* Chart Content Body */}
          <div className="h-[380px] w-full">
            {chartView === 'normalized' && (
              <div className="w-full h-full flex flex-col">
                <div className={`text-xs mb-2 flex items-center justify-between ${themeStyles.textSub}`}>
                  <span>
                    يقيس نسبة صافي التمركز إلى إجمالي العقود عبر الأسابيع الأخيرة. إشارة الصفر (0%) تفصل بين السيطرة الشرائية والبيعية.
                  </span>
                  <span className="font-mono text-[11px] font-bold text-blue-500">مقياس موحّد عادل</span>
                </div>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={normalizedTrajectoryData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isLight ? '#e2e8f0' : '#1e293b'}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke={isLight ? '#94a3b8' : '#64748b'}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke={isLight ? '#94a3b8' : '#64748b'}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}%`}
                        domain={[-100, 100]}
                      />
                      <ReferenceLine y={0} stroke={isLight ? '#64748b' : '#94a3b8'} strokeDasharray="3 3" />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div
                                className={`px-4 py-3 rounded-2xl shadow-2xl border ${
                                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-blue-500/30 text-white'
                                }`}
                              >
                                <div className="text-xs font-bold mb-2 text-center text-blue-400">{label}</div>
                                <div className="space-y-1.5">
                                  {payload.map((entry: any, i: number) => {
                                    const assetIdx = parseInt(entry.dataKey.replace('norm_', ''));
                                    const assetObj = processedAssets[assetIdx];
                                    if (!assetObj) return null;
                                    return (
                                      <div key={i} className="flex items-center justify-between gap-4 text-xs">
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                          <span className="font-bold">{assetObj.asset}:</span>
                                        </div>
                                        <span className="font-mono font-black">{entry.value}%</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        formatter={(val) => {
                          const idx = parseInt(val.replace('norm_', ''));
                          return processedAssets[idx] ? processedAssets[idx].asset : val;
                        }}
                        iconType="circle"
                      />
                      {processedAssets.map((item) => (
                        <Line
                          key={item.asset}
                          type="monotone"
                          dataKey={`norm_${item.index}`}
                          stroke={item.color}
                          strokeWidth={3}
                          dot={{ r: 5, fill: item.color }}
                          activeDot={{ r: 7 }}
                          name={`norm_${item.index}`}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {chartView === 'historical' && (
              <div className="w-full h-full flex flex-col">
                <div className={`text-xs mb-2 ${themeStyles.textSub}`}>
                  حجم صافي العقود الفعلي لكل أصل على مدار الأسابيع الستة الأخيرة.
                </div>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={historicalBarsData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }} barGap={4}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isLight ? '#e2e8f0' : '#1e293b'}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke={isLight ? '#94a3b8' : '#64748b'}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke={isLight ? '#94a3b8' : '#64748b'}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => (v >= 1000 || v <= -1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                      />
                      <ReferenceLine y={0} stroke={isLight ? '#94a3b8' : '#475569'} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div
                                className={`px-4 py-3 rounded-2xl shadow-2xl border ${
                                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-blue-500/30 text-white'
                                }`}
                              >
                                <div className="text-xs font-bold mb-2 text-center text-blue-400">{label}</div>
                                <div className="space-y-1.5">
                                  {payload.map((entry: any, i: number) => {
                                    const assetIdx = parseInt(entry.dataKey.replace('asset_', ''));
                                    const assetObj = processedAssets[assetIdx];
                                    if (!assetObj) return null;
                                    return (
                                      <div key={i} className="flex items-center justify-between gap-4 text-xs">
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                          <span className="font-bold">{assetObj.asset}:</span>
                                        </div>
                                        <span className="font-mono font-black">{formatCurrency(entry.value)} عقد</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        formatter={(val) => {
                          const idx = parseInt(val.replace('asset_', ''));
                          return processedAssets[idx] ? processedAssets[idx].asset : val;
                        }}
                        iconType="circle"
                      />
                      {processedAssets.map((item) => (
                        <Bar
                          key={item.asset}
                          dataKey={`asset_${item.index}`}
                          fill={item.color}
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {chartView === 'delta' && (
              <div className="w-full h-full flex flex-col">
                <div className={`text-xs mb-2 ${themeStyles.textSub}`}>
                  مقارنة التغير الأسبوعي في عقود الشراء (Long Delta) مقابل عقود البيع (Short Delta) لكشف طبيعة تحركات الحيتان.
                </div>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={flowDeltaData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }} barGap={6}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isLight ? '#e2e8f0' : '#1e293b'}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke={isLight ? '#94a3b8' : '#64748b'}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke={isLight ? '#94a3b8' : '#64748b'}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => (v >= 1000 || v <= -1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                      />
                      <ReferenceLine y={0} stroke={isLight ? '#94a3b8' : '#475569'} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div
                                className={`px-4 py-3 rounded-2xl shadow-2xl border ${
                                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-blue-500/30 text-white'
                                }`}
                              >
                                <div className="text-xs font-bold mb-2 text-center text-blue-400">{label}</div>
                                <div className="space-y-1.5">
                                  {payload.map((entry: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between gap-4 text-xs">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                        <span>{entry.name}:</span>
                                      </div>
                                      <span className="font-mono font-black">{formatCurrency(entry.value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="longChange" name="تغير الشراء (Long Δ)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar 
                        dataKey="shortChange" 
                        name="تغير البيع (Short Δ)" 
                        fill={isLight ? '#64748b' : '#f8fafc'} 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Comprehensive Comparison Matrix Table */}
        <div className={`rounded-3xl border shadow-xl overflow-hidden ${themeStyles.panelBg}`}>
          <div className={`p-5 border-b border-blue-500/15 flex items-center justify-between`}>
            <h3 className={`text-base font-black flex items-center gap-2 ${themeStyles.textMain}`}>
              <Activity className="w-5 h-5 text-blue-500" />
              مصفوفة المقارنة والمؤشرات المؤسسية الشاملة (Institutional Comparison Matrix)
            </h3>
            <span className={`text-xs ${themeStyles.textSub}`}>
              جميع المقاييس مجمعة لسهولة المقارنة السريعة
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className={`uppercase font-bold ${isLight ? 'bg-slate-100/80 text-slate-600' : 'bg-slate-900/90 text-blue-200/80'}`}>
                <tr>
                  <th className="px-5 py-3.5">الأصل / الرمز</th>
                  <th className="px-4 py-3.5 text-center">التحيز المؤسسي</th>
                  <th className="px-4 py-3.5 text-left">صافي التمركز</th>
                  <th className="px-4 py-3.5 text-left">التغير الأسبوعي</th>
                  <th className="px-4 py-3.5 text-left">نسبة الشراء/البيع</th>
                  <th className="px-4 py-3.5 text-left">مؤشر COT النسبي</th>
                  <th className="px-4 py-3.5 text-left">التدفق التراكمي (4 أسابيع)</th>
                  <th className="px-5 py-3.5 text-center">طبيعة حركة السيولة</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-blue-500/15'}`}>
                {processedAssets.map((item) => (
                  <tr
                    key={item.asset}
                    className={`transition-colors ${isLight ? 'hover:bg-blue-50/50' : 'hover:bg-blue-950/20'}`}
                  >
                    {/* Asset & Symbol */}
                    <td className="px-5 py-4 font-bold flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <div>
                        <div className={`font-black ${themeStyles.textMain}`}>{item.asset}</div>
                        <div className={`text-[11px] font-mono ${isLight ? 'text-blue-700' : 'text-cyan-300'}`}>
                          {item.symbol}
                        </div>
                      </div>
                    </td>

                    {/* Sentiment Badge */}
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-xl text-[11px] font-black border ${
                          item.netPos >= 0
                            ? isLight
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-blue-500/20 text-cyan-300 border-blue-500/30'
                            : isLight
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-white/10 text-white border-white/20'
                        }`}
                      >
                        {item.netPos >= 0 ? 'صعودي (Bullish)' : 'هبوطي (Bearish)'}
                      </span>
                    </td>

                    {/* Net Position */}
                    <td className="px-4 py-4 text-left font-mono font-black">
                      <span
                        className={
                          item.netPos >= 0
                            ? isLight
                              ? 'text-blue-600'
                              : 'text-cyan-400'
                            : isLight
                            ? 'text-slate-800'
                            : 'text-white'
                        }
                      >
                        {item.netPos > 0 ? `+${formatCurrency(item.netPos)}` : formatCurrency(item.netPos)}
                      </span>
                    </td>

                    {/* Net Change */}
                    <td className="px-4 py-4 text-left font-mono font-black">
                      <span
                        className={
                          item.netChange >= 0
                            ? isLight
                              ? 'text-blue-600'
                              : 'text-cyan-400'
                            : isLight
                            ? 'text-slate-800'
                            : 'text-white'
                        }
                      >
                        {item.netChange > 0 ? `+${formatCurrency(item.netChange)}` : formatCurrency(item.netChange)}
                      </span>
                    </td>

                    {/* Long vs Short */}
                    <td className="px-4 py-4 text-left font-mono">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={isLight ? 'text-blue-600' : 'text-cyan-400'}>
                          {item.longRatio.toFixed(0)}% L
                        </span>
                        <span className="opacity-40">/</span>
                        <span className={isLight ? 'text-slate-600' : 'text-white'}>
                          {item.shortRatio.toFixed(0)}% S
                        </span>
                      </div>
                    </td>

                    {/* COT Index */}
                    <td className="px-4 py-4 text-left font-mono font-black">
                      <span className={isLight ? 'text-blue-700' : 'text-cyan-300'}>
                        {item.cotIndex.toFixed(0)}%
                      </span>
                    </td>

                    {/* 4-Week Net Flow */}
                    <td className="px-4 py-4 text-left font-mono font-black">
                      <span
                        className={
                          item.fourWeekNetDelta >= 0
                            ? isLight
                              ? 'text-blue-600'
                              : 'text-cyan-400'
                            : isLight
                            ? 'text-slate-800'
                            : 'text-white'
                        }
                      >
                        {item.fourWeekNetDelta > 0 ? `+${formatCurrency(item.fourWeekNetDelta)}` : formatCurrency(item.fourWeekNetDelta)}
                      </span>
                    </td>

                    {/* Flow Quality Tag */}
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-xl text-[11px] font-bold ${
                          item.flow.isBullishLeading
                            ? isLight
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-blue-500/25 text-cyan-300'
                            : isLight
                            ? 'bg-slate-200 text-slate-800'
                            : 'bg-white/15 text-white'
                        }`}
                      >
                        {item.flow.badge}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareView;
