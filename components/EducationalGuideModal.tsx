import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, BookOpen, Scale, Users, TrendingUp, TrendingDown, 
  Lightbulb, Shield, Award, HelpCircle, ArrowRight, CheckCircle2,
  AlertTriangle, RefreshCw, BarChart3, ChevronRight, Compass
} from 'lucide-react';
import { ThemeMode } from '../types';

interface EducationalGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
}

type GuideTab = 'intro' | 'trader_types' | 'net_simulator' | 'weekly_momentum' | 'strategy';

const EducationalGuideModal: React.FC<EducationalGuideModalProps> = ({ isOpen, onClose, themeMode }) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('intro');
  const isLight = themeMode === 'light';

  // Interactive Simulator State
  const [simLongs, setSimLongs] = useState<number>(240000);
  const [simShorts, setSimShorts] = useState<number>(85000);

  // Simulation calculations
  const simTotal = simLongs + simShorts;
  const simNet = simLongs - simShorts;
  const simLongPct = simTotal > 0 ? Math.round((simLongs / simTotal) * 100) : 50;
  const simShortPct = 100 - simLongPct;

  // Visual tilt calculation for the balance scale (-20 deg to +20 deg)
  const maxDiff = 300000;
  const tiltDeg = Math.max(-20, Math.min(20, (simNet / maxDiff) * 20));

  // Determine sentiment state
  let sentimentBadge = {
    title: 'توازن وحيرة (Neutral)',
    desc: 'القوى الشرائية والبيعية متقاربة بدون اتجاه مؤسسي واضح.',
    color: isLight ? 'text-amber-700 bg-amber-100 border-amber-300' : 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    statusIcon: Scale,
    impact: 'تذبذب ومسار عرضي'
  };

  if (simLongPct >= 80) {
    sentimentBadge = {
      title: 'تشبع شرائي متطرف (Extreme Bullish / Reversal Alert)',
      desc: 'المراكز الشرائية بلغت ذروة تاريخية؛ احذر من انعكاس محتمل بسبب نقص المشترين الجدد وجني الأرباح الوشيك.',
      color: isLight ? 'text-purple-700 bg-purple-100 border-purple-300' : 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      statusIcon: AlertTriangle,
      impact: 'صعود مفرط مع خطر تصحيح هابط حاد'
    };
  } else if (simLongPct > 55) {
    sentimentBadge = {
      title: 'سيطرة شرائية (Bullish Momentum)',
      desc: 'صناديق التحوط وكبار المضاربين يضخون أموالهم في عقود الشراء؛ الاتجاه الصعودي مدعوم بقوة.',
      color: isLight ? 'text-emerald-700 bg-emerald-100 border-emerald-300' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      statusIcon: TrendingUp,
      impact: 'الأصل مرشح للزيادة والصعود'
    };
  } else if (simShortPct >= 80) {
    sentimentBadge = {
      title: 'تشبع بيعي متطرف (Extreme Bearish / Reversal Alert)',
      desc: 'المراكز البيعية مبالغ فيها تاريخياً؛ احذر من ارتداد صاعد قوي ناتج عن تغطية البيوع (Short Squeeze).',
      color: isLight ? 'text-purple-700 bg-purple-100 border-purple-300' : 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      statusIcon: AlertTriangle,
      impact: 'هبوط مفرط مع خطر ارتداد صاعد مفاجئ'
    };
  } else if (simShortPct > 55) {
    sentimentBadge = {
      title: 'سيطرة بيعية (Bearish Momentum)',
      desc: 'كبار المضاربين يتمركزون في عقود البيع؛ الضغوط البيعية قوية وتدعم استمرار الهبوط.',
      color: isLight ? 'text-rose-700 bg-rose-100 border-rose-300' : 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      statusIcon: TrendingDown,
      impact: 'الأصل مرشح للانخفاض والهبوط'
    };
  }

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md transition-opacity duration-200 overflow-hidden"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-5xl h-[92vh] max-h-[900px] flex flex-col rounded-2xl shadow-2xl border transition-colors overflow-hidden animate-in zoom-in-95 duration-200 ${
          isLight 
            ? 'bg-white border-slate-200 text-slate-900' 
            : 'bg-slate-900 border-blue-800/40 text-slate-100'
        }`}
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-slate-950/60 border-white/5'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">الدليل التعليمي التفاعلي لتقرير COT</h2>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  للمبتدئين والمحترفين
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                افهم كيف تفكر الأموال الذكية وحيتان السوق، وكيف تقرأ الأرقام لتتداول مع الاتجاه المؤسسي الحقيقي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all ${
              isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-white/10 text-slate-400 hover:text-white'
            }`}
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className={`flex items-center gap-1.5 px-4 sm:px-6 py-2 border-b overflow-x-auto no-scrollbar ${
          isLight ? 'bg-slate-100/60 border-slate-200' : 'bg-slate-900/60 border-white/5'
        }`}>
          {[
            { id: 'intro', label: '1. ما هو تقرير COT؟', icon: Compass },
            { id: 'trader_types', label: '2. كبار المضاربين ضد التجاريين', icon: Users },
            { id: 'net_simulator', label: '3. محاكي ميزان القوى وصافي المراكز', icon: Scale },
            { id: 'weekly_momentum', label: '4. قراءة التغير الأسبوعي والتراكم', icon: BarChart3 },
            { id: 'strategy', label: '5. خطة عمل المتداول (كيف تبني قرارك؟)', icon: Award },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as GuideTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? isLight
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : isLight
                      ? 'text-slate-600 hover:bg-white hover:text-slate-900'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          
          {/* TAB 1: INTRO */}
          {activeTab === 'intro' && (
            <div className="space-y-6 animate-fade-in">
              <div className={`p-6 rounded-2xl border ${
                isLight ? 'bg-blue-50/50 border-blue-200/70' : 'bg-blue-950/20 border-blue-800/30'
              }`}>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">ببساطة شديدة: ما هو تقرير COT؟</h3>
                    <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      تقرير <strong>COT</strong> (اختصار لـ <em>Commitments of Traders</em>) هو تقرير حكومي رسمي يصدر أسبوعياً من <strong>هيئة تداول السلع الآجلة الأمريكية (CFTC)</strong> كل يوم جمعة. 
                      هذا التقرير هو بمثابة <strong>"الأشعة السينية"</strong> التي تكشف أين يضع كبار المستثمرين في العالم (صناديق التحوط، البنوك، والمؤسسات العملاقة) أموالهم في أسواق العقود الآجلة للذهب، النفط، المؤشرات والعملات.
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Workflow Diagram */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-blue-500">رحلة صدور البيانات من السوق إلى منصتك</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border relative ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-white/5'
                  }`}>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 mb-2 inline-block">
                      1. يوم الثلاثاء (الإغلاق)
                    </span>
                    <h5 className="font-bold text-sm mb-1">تسجيل العقود المفتوحة</h5>
                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      تقوم بورصات شيكاغو ونيويورك بتجميع كافة عقود الشراء والبيع المفتوحة من جميع البنوك والمؤسسات الكبرى بنهاية تداولات يوم الثلاثاء.
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl border relative ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-white/5'
                  }`}>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-2 inline-block">
                      2. يوم الجمعة (3:30 م بتوقيت نيويورك)
                    </span>
                    <h5 className="font-bold text-sm mb-1">نشر التقرير الرسمي</h5>
                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      تقوم هيئة CFTC بنشر التقرير للعامة، ليعرف العالم كله كيف توزعت سيولة الحيتان بين الشراء والبيع.
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl border relative ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-white/5'
                  }`}>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-2 inline-block">
                      3. في منصة EG-Finance Fx
                    </span>
                    <h5 className="font-bold text-sm mb-1">التحليل اللحظي والمقارنة</h5>
                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      نقوم بمعالجة الأرقام وربطها بالأسعار الحية والتاريخ السابق، ليحدد لك الذكاء الاصطناعي هل الأصل صاعد أو هابط أو محايد فوراً.
                    </p>
                  </div>
                </div>
              </div>

              {/* Core Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-950/30 border-white/5'
                }`}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-bold mb-1">التداول مع صُنّاع الاتجاه (Smart Money)</h5>
                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      الأسعار لا تتحرك عشوائياً، بل تتحرك بالسيولة الضخمة للبنوك وصناديق الاستثمار. التقرير يكشف لك اتجاههم الحقيقي حتى لا تقف في وجه القطار.
                    </p>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-950/30 border-white/5'
                }`}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-bold mb-1">تجنب فخاخ التصحيحات والتقلبات</h5>
                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      كثيراً ما يهبط السعر يوماً أو يومين لتخويف صغار المتداولين، بينما يظهر التقرير أن الحيتان يشترون بكثافة خلف الكواليس، فتتجنب البيع بالخطأ.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRADER TYPES */}
          {activeTab === 'trader_types' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold mb-1">من هم المتداولون في التقرير؟ وكيف نقرأ معسكراتهم؟</h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  يقسم تقرير COT المشاركين في السوق إلى فئتين رئيسيتين تقفان دائماً في وجه بعضهما البعض:
                </p>
              </div>

              {/* Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Non-Commercials */}
                <div className={`p-6 rounded-2xl border relative overflow-hidden ${
                  isLight ? 'bg-blue-50/40 border-blue-200' : 'bg-blue-950/20 border-blue-700/40'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-600 text-white">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base">كبار المضاربين (Non-Commercials)</h4>
                        <span className="text-xs text-blue-500 font-semibold font-mono">الأموال الذكية - Smart Money</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      محرك الاتجاه الرئيسي
                    </span>
                  </div>

                  <ul className={`text-xs space-y-2.5 leading-relaxed mb-4 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span><strong>من هم؟</strong> صناديق التحوط العملاقة (Hedge Funds)، البنوك الاستثمارية الكبرى، ومدراء الأصول.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span><strong>هدفهم في السوق:</strong> تحقيق الأرباح الرأسمالية فقط من خلال ركوب الترند (الاتجاه).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span><strong>سلوكهم:</strong> يتبعون الاتجاه بقوة (Trend Followers)؛ يشترون عندما يصعد السعر، ويبيعون عندما يهبط.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span><strong>القاعدة الذهبية:</strong> نحن نتبع دائماً صافي مراكز هذه الفئة لأنها الفئة التي ترفع أو تخفض الأسعار!</span>
                    </li>
                  </ul>

                  <div className={`p-3 rounded-xl border text-xs font-medium ${
                    isLight ? 'bg-white/80 border-blue-200 text-blue-800' : 'bg-slate-900/80 border-blue-500/20 text-blue-300'
                  }`}>
                    💡 <strong>نصيحة للمتعلم:</strong> عندما ترى صافي مراكز (Non-Commercials) إيجابياً ومتزايداً، فهذا تأكيد صعودي قوي (Bullish Bias).
                  </div>
                </div>

                {/* Commercials */}
                <div className={`p-6 rounded-2xl border relative overflow-hidden ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/30 border-white/5'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-500 text-white">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base">المؤسسات التجارية (Commercials)</h4>
                        <span className="text-xs text-amber-500 font-semibold font-mono">التحوط وتأمين المخاطر - Hedgers</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      عكس الاتجاه (تحوط)
                    </span>
                  </div>

                  <ul className={`text-xs space-y-2.5 leading-relaxed mb-4 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>من هم؟</strong> الشركات المنتجة والمستهلكة للسلعة (مثل شركات تعدين الذهب، مزارعي القمح، أو شركات الطيران التي تشتري النفط).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>هدفهم في السوق:</strong> حماية أعمالهم وتثبيت أسعار مستقبلية (Hedging) وليس المضاربة للربح السريع.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>سلوكهم:</strong> يتداولون عادة <strong>عكس الاتجاه</strong>! فإذا ارتفع الذهب جداً، يبيعون عقوداً آجلة لتأمين أرباح مناجمهم لسنوات قادمة.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>القاعدة الذهبية:</strong> وجودهم كبائعين لا يعني أن السوق سينهار فوراً، بل هو تحوط طبيعي لإنتاجهم.</span>
                    </li>
                  </ul>

                  <div className={`p-3 rounded-xl border text-xs font-medium ${
                    isLight ? 'bg-white/80 border-slate-200 text-slate-700' : 'bg-slate-900/80 border-white/10 text-slate-300'
                  }`}>
                    🛡️ <strong>فائدة مراقبتهم:</strong> عندما يتوقف التجاريون فجأة عن التحوط البيعي ويبدأون في الشراء، فهذا يشير إلى أن الأسعار وصلت إلى قاع رخيص جداً.
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: NET POSITIONS SIMULATOR */}
          {activeTab === 'net_simulator' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold">محاكي ميزان القوى وصافي المراكز (Net Positions Simulator)</h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    حرّك مؤشرات الشراء والبيع لتشاهد كيف يتغير ميزان السوق، وماذا يعني الناتج لقرارك الاستثماري:
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSimLongs(240000);
                    setSimShorts(85000);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة ضبط الأرقام</span>
                </button>
              </div>

              {/* The Interactive Balance Scale Visualizer */}
              <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center relative overflow-hidden ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-white/5'
              }`}>
                
                {/* Scale Axis & Beam with dynamic tilt */}
                <div className="w-full max-w-lg h-36 flex flex-col items-center justify-center relative">
                  
                  {/* Fulcrum (المرتكز) */}
                  <div className="absolute bottom-2 z-10 flex flex-col items-center">
                    <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[28px] border-b-blue-600"></div>
                    <div className="w-16 h-2 bg-blue-700 rounded-full mt-0.5"></div>
                  </div>

                  {/* Tilting Beam (ذراع الميزان) */}
                  <div 
                    className="w-full flex items-center justify-between transition-transform duration-500 ease-out z-20"
                    style={{ transform: `rotate(${tiltDeg}deg)` }}
                  >
                    {/* Left Pan: LONGS */}
                    <div className="flex flex-col items-center">
                      <div className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                        <TrendingUp className="w-4 h-4" />
                        <span>عقود الشراء (Longs)</span>
                      </div>
                      <div className="w-0.5 h-6 bg-emerald-500/60"></div>
                      <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs border border-emerald-500/30">
                        {simLongs.toLocaleString()} عقد ({simLongPct}%)
                      </div>
                    </div>

                    {/* Right Pan: SHORTS */}
                    <div className="flex flex-col items-center">
                      <div className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                        <TrendingDown className="w-4 h-4" />
                        <span>عقود البيع (Shorts)</span>
                      </div>
                      <div className="w-0.5 h-6 bg-rose-500/60"></div>
                      <div className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 font-mono font-bold text-xs border border-rose-500/30">
                        {simShorts.toLocaleString()} عقد ({simShortPct}%)
                      </div>
                    </div>
                  </div>

                </div>

                {/* The Equation Display */}
                <div className={`mt-4 px-4 py-2 rounded-xl border font-mono text-xs sm:text-sm font-bold flex items-center gap-2 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/10'
                }`}>
                  <span>صافي المراكز (Net) =</span>
                  <span className="text-emerald-500">{simLongs.toLocaleString()} (شراء)</span>
                  <span>-</span>
                  <span className="text-rose-500">{simShorts.toLocaleString()} (بيع)</span>
                  <span>=</span>
                  <span className={`px-2 py-0.5 rounded text-sm ${simNet >= 0 ? 'bg-emerald-500/20 text-emerald-400 font-extrabold' : 'bg-rose-500/20 text-rose-400 font-extrabold'}`}>
                    {simNet > 0 ? `+${simNet.toLocaleString()}` : simNet.toLocaleString()}
                  </span>
                </div>

                {/* Sentiment Result Banner */}
                <div className={`mt-4 w-full p-4 rounded-xl border flex items-start gap-3 transition-all ${sentimentBadge.color}`}>
                  <sentimentBadge.statusIcon className="w-6 h-6 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{sentimentBadge.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-black/10 font-bold">
                        التأثير: {sentimentBadge.impact}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">{sentimentBadge.desc}</p>
                  </div>
                </div>

              </div>

              {/* Sliders Control Panel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Longs Slider */}
                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/30 border-white/5'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" />
                      <span>عقود الشراء (Long Positions)</span>
                    </label>
                    <span className="font-mono font-bold text-xs">{simLongs.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="400000"
                    step="5000"
                    value={simLongs}
                    onChange={(e) => setSimLongs(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>10k</span>
                    <span>200k</span>
                    <span>400k</span>
                  </div>
                </div>

                {/* Shorts Slider */}
                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/30 border-white/5'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4" />
                      <span>عقود البيع (Short Positions)</span>
                    </label>
                    <span className="font-mono font-bold text-xs">{simShorts.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="400000"
                    step="5000"
                    value={simShorts}
                    onChange={(e) => setSimShorts(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>10k</span>
                    <span>200k</span>
                    <span>400k</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: WEEKLY MOMENTUM */}
          {activeTab === 'weekly_momentum' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold mb-1">كيف تقرأ "التغير الأسبوعي" (Weekly Change)؟</h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  الرقم الصافي الإجمالي يخبرك بالوضع الحالي، لكن <strong>التغير الأسبوعي</strong> يخبرك إلى أين تتحرك السيولة هذا الأسبوع. إليك الحالات الأربع الكلاسيكية:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Scenario 1 */}
                <div className={`p-5 rounded-xl border ${
                  isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-800/40'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500">الحالة 1: أقوى إشارة صعودية</span>
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h4 className="font-bold text-sm mb-1 text-emerald-600 dark:text-emerald-400">تراكم شرائي حقيقي (Accumulation)</h4>
                  <div className="font-mono text-xs font-semibold mb-2 space-y-0.5 text-slate-600 dark:text-slate-300">
                    <p>عقود الشراء: <span className="text-emerald-500">زيادة (+)</span></p>
                    <p>عقود البيع: <span className="text-rose-500">انخفاض (-)</span> أو ثبات</p>
                  </div>
                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    صناديق الاستثمار تضخ سيولة جديدة لشراء الأصل وتغلق صفقات البيع. هذه أقوى دلالة على استمرار الصعود (الذهب أو العملة ستزيد).
                  </p>
                </div>

                {/* Scenario 2 */}
                <div className={`p-5 rounded-xl border ${
                  isLight ? 'bg-rose-50/50 border-rose-200' : 'bg-rose-950/20 border-rose-800/40'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-500">الحالة 2: أقوى إشارة هبوطية</span>
                    <TrendingDown className="w-5 h-5 text-rose-500" />
                  </div>
                  <h4 className="font-bold text-sm mb-1 text-rose-600 dark:text-rose-400">تصريف وتخارج مكثف (Distribution)</h4>
                  <div className="font-mono text-xs font-semibold mb-2 space-y-0.5 text-slate-600 dark:text-slate-300">
                    <p>عقود الشراء: <span className="text-rose-500">انخفاض (-)</span></p>
                    <p>عقود البيع: <span className="text-rose-500">زيادة (+)</span></p>
                  </div>
                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    الحيتان يبيعون ما بحوزتهم ويفتحون صفقات بيع جديدة للمراهنة على الهبوط. الأصل مرشح للهبوط والانخفاض.
                  </p>
                </div>

                {/* Scenario 3 */}
                <div className={`p-5 rounded-xl border ${
                  isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/20 border-amber-800/40'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-500">الحالة 3: فخ الصعود المؤقت</span>
                    <RefreshCw className="w-5 h-5 text-amber-500" />
                  </div>
                  <h4 className="font-bold text-sm mb-1 text-amber-600 dark:text-amber-400">تغطية بيوع فقط (Short Covering)</h4>
                  <div className="font-mono text-xs font-semibold mb-2 space-y-0.5 text-slate-600 dark:text-slate-300">
                    <p>عقود الشراء: <span className="text-slate-400">ثابتة أو انخفاض</span></p>
                    <p>عقود البيع: <span className="text-amber-500">انخفاض كبير (-)</span></p>
                  </div>
                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    ارتفاع السعر ليس ناتجاً عن دخول مشترين جدد، بل لأن البائعين يغلقون صفقاتهم لجني الأرباح. الصعود هنا يكون مؤقتاً ومحايداً غالباً.
                  </p>
                </div>

                {/* Scenario 4 */}
                <div className={`p-5 rounded-xl border ${
                  isLight ? 'bg-purple-50/50 border-purple-200' : 'bg-purple-950/20 border-purple-800/40'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-500">الحالة 4: جني أرباح وتصحيح</span>
                    <AlertTriangle className="w-5 h-5 text-purple-500" />
                  </div>
                  <h4 className="font-bold text-sm mb-1 text-purple-600 dark:text-purple-400">تصفية صفقات شراء (Long Liquidation)</h4>
                  <div className="font-mono text-xs font-semibold mb-2 space-y-0.5 text-slate-600 dark:text-slate-300">
                    <p>عقود الشراء: <span className="text-purple-500">انخفاض (-)</span></p>
                    <p>عقود البيع: <span className="text-slate-400">ثابتة أو انخفاض طفيف</span></p>
                  </div>
                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    هبوط السعر سببه قيام المشترين بجني أرباحهم وتقليل تعرضهم للمخاطر بعد صعود طويل. غالباً ما يكون تصحيحاً مؤقتاً ثم يعود للصعود.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: STRATEGY & ACTIONABLE PLAYBOOK */}
          {activeTab === 'strategy' && (
            <div className="space-y-6 animate-fade-in">
              <div className={`p-5 rounded-2xl border ${
                isLight ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' : 'bg-gradient-to-r from-blue-950/30 to-slate-900 border-blue-800/30'
              }`}>
                <h3 className="text-base font-bold mb-1">خطة عمل المتداول: كيف تبني نتائجك الاستثمارية من التقرير؟</h3>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  إليك المنهجية المعتمدة لدى كبار المتداولين المؤسسيين لدمج بيانات COT مع الأخبار والتحليل الأساسي في 4 خطوات بسيطة:
                </p>
              </div>

              <div className="space-y-4">
                
                <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-950/40 border-white/5'
                }`}>
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">الخطوة الأولى: تحديد الاتجاه العام (Smart Money Direction)</h4>
                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      انظر إلى عمود <strong>صافي المراكز (Net Positions)</strong> لكبار المضاربين؛ إذا كان إيجابياً ومتزايداً لعدة أسابيع متتالية، فالاتجاه الأكبر صاعد. وإذا كان سالباً ومتزايداً في السلبية، فالاتجاه الأكبر هابط.
                    </p>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-950/40 border-white/5'
                }`}>
                  <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">الخطوة الثانية: مطابقة التقرير مع الأخبار والتحليل الأساسي</h4>
                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      اسأل المساعد الذكي في الموقع: <em>"ما هو تأثير أخبار الفيدرالي والتضخم هذا الأسبوع؟"</em>. 
                      إذا كانت الأخبار داعمة لهبوط الدولار وتمركزات الذهب في COT تظهر شراءً متزايداً، فهنا تتطابق الرؤيتان (أخبار + سيولة) وتكون الصفقة عالية الجودة.
                    </p>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-950/40 border-white/5'
                }`}>
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">الخطوة الثالثة: مراقبة وتيرة التغير الأسبوعي</h4>
                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      انظر لعمود التغير (Net Change): هل الحيتان يسرعون من وتيرة الشراء أم بدأ الشراء يتباطأ؟ تباطؤ وتيرة الشراء ينبهك مبكراً إلى أن الموجة الصاعدة تقترب من نهايتها.
                    </p>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-950/40 border-white/5'
                }`}>
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">الخطوة الرابعة: الانتباه للتطرف التاريخي (Sentiment Extremes)</h4>
                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      عندما يصل صافي مراكز أصل معين (مثل الذهب أو النفط) إلى أعلى رقم في تاريخه لسنوات، لا تدخل شراءً متأخراً! لأن الجميع اشترى بالفعل ولم يتبق مشترين جدد لدفع السعر لأعلى، مما يجعله عرضة لانعكاس وشيك.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-white/5'
        }`}>
          <div className="flex items-center gap-2 text-xs text-blue-500 font-semibold">
            <Compass className="w-4 h-4" />
            <span>يمكنك دائماً سؤال المساعد الصوتي أو النصي عن أي مصطلح لم تفهمه بالكامل.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeTab !== 'strategy' ? (
              <button
                onClick={() => {
                  const tabs: GuideTab[] = ['intro', 'trader_types', 'net_simulator', 'weekly_momentum', 'strategy'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1]);
                  }
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
              >
                <span>القسم التالي</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
              >
                جاهز للبدء والتطبيق! 🚀
              </button>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default EducationalGuideModal;
