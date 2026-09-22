
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Bot, Loader2, Sparkles, Copy, Check, TrendingUp, TrendingDown, Minus, 
  Languages, ChevronDown, Calendar, Filter, Activity, Scale, Target, Zap, 
  ArrowRight, AlertTriangle, Info, AlertOctagon, Globe, Newspaper, Brain, 
  ShieldAlert, Volume2, VolumeX, RefreshCw, Flame, Landmark, Clock, ExternalLink,
  Layers, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { SummaryRow } from '../types';
import { formatCurrency } from '../utils';
import { cleanAndCompleteJson, parseIncrementalAnalysis, streamGemini } from '../streamingParser';

interface AIAnalysisOverlayProps {
  isAiOfflineMode?: boolean;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  analysis: string | null;
  title: string;
  data: SummaryRow | null;
}

export interface ForexFactoryEvent {
  id: string;
  title: string;
  country: string;
  date: string;
  impact: 'High' | 'Holiday';
  forecast: string;
  previous: string;
  isRed: boolean;
  isHoliday: boolean;
}

interface PlaybookEvent {
    event: string;
    date: string;
    forecast: string;
    plan: string;
    why: string;
    when_to_act: string;
    impact_if_deviates: string;
    country?: string;
    impact?: 'High' | 'Holiday';
}

interface AnalysisData {
    sentiment: {
        label: string;
        reason: string;
    };
    perspective: string;
    actionable_advice: string;
    key_levels?: {
        support: string;
        resistance: string;
        pivot_point: string;
        support_2?: string;
        resistance_2?: string;
        current_price?: string;
        invalidation_level?: string;
    };
    institutional_bias?: string;
    global_context?: {
        news_highlights: string[];
        weekly_impact: string;
        market_sentiment_score?: number;
        key_risks?: string[];
    };
    news_summary?: string; // Backwards compatibility
    playbook: PlaybookEvent[];
}

const AIAnalysisOverlay: React.FC<AIAnalysisOverlayProps> = ({ isAiOfflineMode, isOpen, onClose, isLoading, analysis, title, data }) => {
  const [copied, setCopied] = useState(false);
  const [parsedData, setParsedData] = useState<AnalysisData | null>(null);
  
  // Translation State & In-Memory Cache
  const [currentLang, setCurrentLang] = useState('English');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const translationCacheRef = useRef<Record<string, AnalysisData>>({});

  // Voice State
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Forex Factory Calendar Sync State
  const [ffEvents, setFfEvents] = useState<ForexFactoryEvent[]>([]);
  const [isSyncingFF, setIsSyncingFF] = useState(false);
  const [ffLastSynced, setFfLastSynced] = useState<Date | null>(null);
  const [showLiveCalendarFeed, setShowLiveCalendarFeed] = useState(false);
  const [keyLevelsView, setKeyLevelsView] = useState<'ladder' | 'zones'>('ladder');
  const [copiedLevelId, setCopiedLevelId] = useState<string | null>(null);
  const baseSentimentColorRef = useRef<'emerald' | 'rose' | 'blue' | null>(null);
  const prevTitleRef = useRef(title);

  const fetchForexFactoryCalendar = useCallback(async (forceRefresh = false) => {
    setIsSyncingFF(true);
    try {
      const url = forceRefresh ? '/api/forexfactory-calendar?refresh=true' : '/api/forexfactory-calendar';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.events)) {
          setFfEvents(data.events);
          setFfLastSynced(new Date(data.syncedAt || Date.now()));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch Forex Factory calendar:", err);
    } finally {
      setIsSyncingFF(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || prevTitleRef.current !== title) {
      prevTitleRef.current = title;
      baseSentimentColorRef.current = null;
    }
    if (isOpen) {
      fetchForexFactoryCalendar(false);
    }
  }, [isOpen, title, fetchForexFactoryCalendar]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        if (synthRef.current) {
          setAvailableVoices(synthRef.current.getVoices());
        }
      };
      
      // Load voices immediately and attach event listener for when they are ready (especially needed for Chrome)
      loadVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const toggleVoice = () => {
    if (!synthRef.current || !parsedData) return;

    if (isPlayingVoice) {
      synthRef.current.cancel();
      setIsPlayingVoice(false);
      return;
    }

    // Construct text to read with localized prefixes
    let textToRead = '';
    if (currentLang === 'Arabic') {
      textToRead = `
        توجّه السوق: ${parsedData.sentiment.label}. ${parsedData.sentiment.reason}.
        نظرة الخبير: ${parsedData.perspective}.
        نصيحة عملية: ${parsedData.actionable_advice}.
      `;
    } else if (currentLang === 'French') {
      textToRead = `
        Sentiment du marché: ${parsedData.sentiment.label}. ${parsedData.sentiment.reason}.
        Perspective du mentor: ${parsedData.perspective}.
        Conseil pratique: ${parsedData.actionable_advice}.
      `;
    } else {
      textToRead = `
        Market Sentiment: ${parsedData.sentiment.label}. ${parsedData.sentiment.reason}.
        Mentor's Perspective: ${parsedData.perspective}.
        Actionable Advice: ${parsedData.actionable_advice}.
      `;
    }

    const utterance = new SpeechSynthesisUtterance(textToRead);
    
    // Set language based on current selection
    let langCode = 'en-US';
    if (currentLang === 'Arabic') {
      langCode = 'ar-SA';
    } else if (currentLang === 'French') {
      langCode = 'fr-FR';
    }
    
    utterance.lang = langCode;

    // Try to find a voice that matches the language
    const voices = availableVoices.length > 0 ? availableVoices : synthRef.current.getVoices();
    let targetVoice;
    
    if (currentLang === 'Arabic') {
       // Broad search for any Arabic voice (ar-SA, ar-AE, Google Arabic, etc.)
       targetVoice = voices.find(v => v.lang.toLowerCase().startsWith('ar') || v.name.toLowerCase().includes('arabic') || v.name.includes('عربي'));
    } else if (currentLang === 'French') {
       targetVoice = voices.find(v => v.lang.toLowerCase().startsWith('fr') || v.name.toLowerCase().includes('french'));
    } else {
       targetVoice = voices.find(v => v.lang.toLowerCase().startsWith('en') || v.name.toLowerCase().includes('english'));
    }

    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);

    synthRef.current.speak(utterance);
    setIsPlayingVoice(true);
  };

  useEffect(() => {
    if (analysis) {
        const cleanJson = analysis.replace(/```json\n?|\n?```/g, '').trim();
        // 1. If complete and valid JSON, directly set
        try {
            if (cleanJson.startsWith('{') || cleanJson.startsWith('[')) {
                const data = JSON.parse(cleanJson);
                setParsedData(data);
                if (!isLoading && currentLang === 'English') {
                    translationCacheRef.current['English'] = data;
                }
                return;
            }
        } catch (_) {
            // Incomplete JSON chunk during active streaming
        }

        // 2. Incremental streaming parse for partial live updates
        setParsedData((prev) => {
            const incremental = parseIncrementalAnalysis(prev, cleanJson);
            return incremental || prev;
        });

        if (!isLoading && currentLang === 'English') {
            const completed = cleanAndCompleteJson(cleanJson);
            if (completed) {
                translationCacheRef.current['English'] = completed;
            }
        }
    } else if (!isLoading) {
        setParsedData(null);
        translationCacheRef.current = {};
    }
  }, [analysis, isLoading, currentLang]);

  // Handle click outside for language menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [langMenuRef]);

  if (!isOpen) {
    if (synthRef.current && isPlayingVoice) {
      synthRef.current.cancel();
      setIsPlayingVoice(false);
    }
    return null;
  }

  const handleCopy = () => {
    if (analysis) {
      navigator.clipboard.writeText(analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLanguageChange = async (lang: string) => {
    setIsLangMenuOpen(false);
    if (lang === currentLang) return;

    // 1. Instant Cache Hit: Return in 0ms without network call
    if (translationCacheRef.current[lang]) {
        setCurrentLang(lang);
        setParsedData(translationCacheRef.current[lang]);
        return;
    }

    if (lang === 'English') {
        setCurrentLang('English');
        if (translationCacheRef.current['English']) {
            setParsedData(translationCacheRef.current['English']);
        }
        return;
    }

    // Always translate from base English data for highest fidelity
    const sourceData = translationCacheRef.current['English'] || parsedData;
    if (!sourceData) return;

    setCurrentLang(lang);
    setIsTranslating(true);

    try {
        const prompt = `You are a high-speed institutional financial translation engine.
Translate the string values in this financial JSON into ${lang === 'Arabic' ? 'natural, professional financial Arabic (العربية الفصحى لأسواق المال والتحليل المالي)' : lang}.

RULES:
1. Translate ONLY string values. Keep ALL JSON keys in English verbatim.
2. Keep numbers, percentages, ticker symbols (e.g. USD, EUR, DXY, COT), price targets ($), and dates in Latin text/digits.
3. For Arabic, use accurate trading terminology (e.g., Risk-On: شهية مخاطرة مرتفعة, Risk-Off: تجنب المخاطر, Support: دعم, Resistance: مقاومة, Pivot: نقطة محورية, Bank Holiday: عطلة بنكية).
4. Return ONLY valid JSON matching the exact schema.

${JSON.stringify(sourceData)}`;

        const fullTranslated = await streamGemini(
            {
                model: 'gemini-3.8-flash',
                prompt,
                thinkingLevel: 'LOW',
                responseMimeType: "application/json"
            },
            (_chunk, accumulated) => {
                const partial = cleanAndCompleteJson(accumulated);
                if (partial) {
                    setParsedData(prev => parseIncrementalAnalysis(prev, accumulated));
                }
            }
        );

        const clean = fullTranslated.replace(/```json\n?|\n?```/g, '').trim();
        const finalData = cleanAndCompleteJson(clean);
        if (finalData) {
            translationCacheRef.current[lang] = finalData;
            setParsedData(finalData);
        }
    } catch (error) {
        console.error("Translation failed:", error);
    } finally {
        setIsTranslating(false);
    }
  };

  const getSentimentColor = (label: string) => {
      // 1. If base sentiment color was already determined from the initial analysis, preserve it strictly
      if (baseSentimentColorRef.current) {
          return baseSentimentColorRef.current;
      }

      // 2. Check base English analysis if cached
      const englishLabel = translationCacheRef.current['English']?.sentiment?.label;
      if (englishLabel) {
          const eng = englishLabel.toLowerCase();
          if (eng.includes('bullish') || eng.includes('risk-on')) {
              baseSentimentColorRef.current = 'emerald';
              return 'emerald';
          }
          if (eng.includes('bearish') || eng.includes('risk-off')) {
              baseSentimentColorRef.current = 'rose';
              return 'rose';
          }
      }

      // 3. Multi-language sentiment detection (English, Arabic, French)
      const l = (label || '').toLowerCase();
      // Bullish markers
      if (
          l.includes('bullish') || l.includes('risk-on') ||
          l.includes('صعود') || l.includes('صاعد') || l.includes('ايجابي') || l.includes('إيجابي') || l.includes('شراء') ||
          l.includes('haussier') || l.includes('positif')
      ) {
          baseSentimentColorRef.current = 'emerald';
          return 'emerald';
      }

      // Bearish markers
      if (
          l.includes('bearish') || l.includes('risk-off') ||
          l.includes('هبوط') || l.includes('هابط') || l.includes('سلبي') || l.includes('بيع') ||
          l.includes('baissier') || l.includes('négatif') || l.includes('negatif')
      ) {
          baseSentimentColorRef.current = 'rose';
          return 'rose';
      }

      // 4. Fallback to Net Change direction if provided
      if (data && typeof data["Net Change"] === 'number') {
          if (data["Net Change"] > 0) {
              baseSentimentColorRef.current = 'emerald';
              return 'emerald';
          } else if (data["Net Change"] < 0) {
              baseSentimentColorRef.current = 'rose';
              return 'rose';
          }
      }

      return 'blue';
  };

  const getImpactIcon = (text: string) => {
      const lower = text.toLowerCase();
      if (lower.includes('high') || lower.includes('severe') || lower.includes('major') || lower.includes('critical')) {
          return <AlertOctagon className="w-4 h-4 text-rose-500" />;
      }
      if (lower.includes('medium') || lower.includes('moderate')) {
          return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      }
      return <Info className="w-4 h-4 text-blue-400" />;
  };

  const isRTL = currentLang === 'Arabic';

  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.04 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    show: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { type: "spring" as const, stiffness: 280, damping: 24 } 
    }
  };



  const renderContent = () => {
      if (!parsedData) {
          return (
              <div className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-8 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-4 my-6">
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                      <AlertTriangle className="w-8 h-8 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-medium text-white">Market Analysis</h3>
                  <p className="text-slate-300 text-sm max-w-lg leading-relaxed whitespace-pre-wrap font-sans">{analysis || "No analysis available."}</p>
              </div>
          );
      }

      const sentimentLabel = parsedData.sentiment?.label || 'Analyzing...';
      const sentimentColor = getSentimentColor(sentimentLabel);
      const isBullish = sentimentColor === 'emerald';
      const isBearish = sentimentColor === 'rose';

      return (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className={`flex flex-col gap-6 p-1 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
              {/* Live Streaming Indicator Banner */}
              {(isLoading || isTranslating) && (
                  <motion.div 
                      initial={{ opacity: 0, y: -6 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="flex items-center justify-between gap-3 px-4 py-2.5 bg-gradient-to-r from-blue-950/50 via-indigo-950/40 to-slate-900/50 border border-blue-500/30 rounded-2xl backdrop-blur-md shadow-lg shadow-blue-950/20"
                  >
                      <div className="flex items-center gap-2.5">
                          <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                          </span>
                          <span className="text-xs font-semibold text-blue-200 tracking-wide">
                              {isTranslating 
                                  ? (currentLang === 'Arabic' ? "جاري بث الترجمة الفورية لحظياً..." : `Streaming translation to ${currentLang}...`) 
                                  : (isRTL ? "جاري بث التحليل المؤسسي لحظياً عبر الذكاء الاصطناعي..." : "Streaming Real-Time Institutional Analysis...")}
                          </span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                              AI • LIVE STREAM
                          </span>
                          <div className="flex gap-0.5 items-center h-3">
                              <span className="w-1 bg-blue-400 rounded-full animate-pulse h-2"></span>
                              <span className="w-1 bg-blue-400 rounded-full animate-pulse delay-75 h-3"></span>
                              <span className="w-1 bg-blue-400 rounded-full animate-pulse delay-150 h-1.5"></span>
                          </div>
                      </div>
                  </motion.div>
              )}

              {isAiOfflineMode && (
                  <motion.div variants={itemVariants} className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-start gap-3 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-500/5 to-rose-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                          <h4 className="text-rose-400 font-medium text-sm">AI Service Quota Exceeded</h4>
                          <p className="text-rose-400/80 text-xs mt-1">
                              Your API key has hit its rate limit or quota. The analysis shown below is a generic, fallback report generated locally. Please check your Google AI Studio billing/plan, wait a moment, and try again.
                          </p>
                      </div>
                  </motion.div>
              )}
              
              {/* Top Row: Market Sentiment & Mentor's Perspective */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Market Sentiment Card - First on left (or right in RTL) */}
                  <motion.div variants={itemVariants} className={`lg:col-span-5 rounded-3xl p-7 border relative overflow-hidden flex flex-col justify-between group transition-all duration-500 hover:shadow-2xl
                      ${isBullish ? 'bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40' : 
                        isBearish ? 'bg-rose-950/20 border-rose-500/20 hover:border-rose-500/40' : 
                        'bg-blue-950/20 border-blue-500/20 hover:border-blue-500/40'}`}>
                      
                      {/* Background Glow */}
                      <div className={`absolute -top-20 -right-20 w-44 h-44 blur-2xl rounded-full opacity-20 pointer-events-none transition-all duration-1000
                          ${isBullish ? 'bg-emerald-500' : isBearish ? 'bg-rose-500' : 'bg-blue-500'}`}></div>

                      <div className="relative z-10">
                          <div className="flex items-center justify-between gap-3 mb-5">
                              <div className="flex items-center gap-2.5">
                                  <div className={`p-2 rounded-lg ${isBullish ? 'bg-emerald-500/10 text-emerald-400' : isBearish ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    <Activity className="w-5 h-5" />
                                  </div>
                                  <span className="text-xs font-medium uppercase tracking-widest text-slate-400">Market Sentiment</span>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider border
                                  ${isBullish ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
                                    isBearish ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 
                                    'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
                                  {isBullish ? (isRTL ? 'صعودي / Bullish' : 'Bullish') : isBearish ? (isRTL ? 'هبوطي / Bearish' : 'Bearish') : (isRTL ? 'حيادي / Neutral' : 'Neutral')}
                              </span>
                          </div>
                          
                          <h2 className={`text-3xl sm:text-4xl font-semibold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r 
                              ${isBullish ? 'from-emerald-400 to-teal-300' : isBearish ? 'from-rose-400 to-rose-300' : 'from-blue-400 to-indigo-300'}`}>
                              {parsedData.sentiment?.label || 'Analyzing...'}
                          </h2>
                          <p className="text-slate-300 text-sm leading-relaxed font-medium opacity-90">
                              {parsedData.sentiment?.reason || (isLoading ? 'Analyzing market positioning & institutional flows...' : '')}
                          </p>
                      </div>

                      {/* Mini Data Snapshot if available */}
                      {data && (
                          <div className="mt-6 pt-5 border-t border-white/5 relative z-10">
                              <div className="flex justify-between items-end">
                                  <div>
                                      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-medium">Net Positions</div>
                                      <div className="font-mono font-medium text-xl text-white tracking-tight">{formatCurrency(data["Net Positions"])}</div>
                                  </div>
                                  <div className={`text-right ${isRTL ? 'text-left' : ''}`}>
                                      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-medium">Weekly Change</div>
                                      <div className={`font-mono font-medium text-lg flex items-center gap-1 ${data["Net Change"] > 0 ? 'text-emerald-400' : 'text-rose-400'} ${isRTL ? 'flex-row-reverse' : 'justify-end'}`}>
                                          {data["Net Change"] > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                          {formatCurrency(data["Net Change"])}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                  </motion.div>

                  {/* Mentor's Perspective & If I Were You */}
                  <motion.div variants={itemVariants} className="lg:col-span-7 bg-slate-900/40 border border-white/5 rounded-3xl p-7 relative overflow-hidden backdrop-blur-sm group hover:border-white/10 transition-all duration-500 flex flex-col justify-between">
                      <div className={`absolute top-0 w-1.5 h-full bg-gradient-to-b from-blue-500 via-white to-blue-600 ${isRTL ? 'right-0' : 'left-0'}`}></div>
                      
                      <div className="relative z-10">
                          <div className="flex items-start gap-4 mb-4">
                              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl shadow-lg shadow-blue-500/20 shrink-0 ring-1 ring-white/10">
                                  <Brain className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                  <h3 className="text-2xl font-medium text-white mb-1.5 font-heading tracking-tight">Mentor's Perspective</h3>
                                  <p className="text-slate-400 text-sm leading-relaxed">
                                      {parsedData.perspective || (isLoading ? "Synthesizing institutional perspective..." : "")}
                                      {isLoading && <span className="inline-block w-1.5 h-3.5 ml-1 bg-blue-400 animate-pulse align-middle" />}
                                  </p>
                              </div>
                          </div>
                      </div>

                      <div className="mt-4 bg-gradient-to-r from-blue-500/10 to-blue-400/5 rounded-2xl p-5 border border-blue-500/10 relative overflow-hidden group-hover:border-blue-500/20 transition-colors">
                          <div className="absolute top-0 right-0 p-3 opacity-10">
                              <Target className="w-20 h-20 text-blue-400 -rotate-12" />
                          </div>
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 text-white">
                                <Sparkles className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-medium uppercase tracking-wider text-blue-200">If I Were You</span>
                            </div>
                            <p className="text-blue-50 text-base sm:text-lg font-medium leading-relaxed italic">
                                "{parsedData.actionable_advice || (isLoading ? "Formulating daily execution plan..." : "")}"
                                {isLoading && <span className="inline-block w-1.5 h-4 ml-1 bg-blue-300 animate-pulse align-middle" />}
                            </p>
                          </div>
                      </div>
                  </motion.div>
              </div>

              {/* Second Row: Institutional Bias & Key Levels */}
              {(parsedData.institutional_bias || parsedData.key_levels) ? (
                  <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                      {/* Institutional Bias */}
                      {parsedData.institutional_bias && (
                          <motion.div variants={itemVariants} className={`bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950/95 border border-white/10 rounded-3xl p-5 sm:p-6 lg:p-7 relative overflow-hidden flex flex-col justify-between shadow-2xl backdrop-blur-xl group hover:border-white/15 transition-all duration-300 ${!parsedData.key_levels ? 'lg:col-span-2' : ''}`}>
                              {/* Ambient background glow */}
                              <div className="absolute -top-16 -left-16 w-48 h-48 bg-blue-500/5 blur-3xl pointer-events-none rounded-full"></div>

                              <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                                  <div>
                                      <div className="flex items-center gap-2.5 pb-3 border-b border-white/5 text-blue-400">
                                          <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-indigo-500/10 rounded-2xl border border-blue-500/30 text-blue-300 shadow-md">
                                              <ShieldAlert className="w-4 h-4 text-blue-400" />
                                          </div>
                                          <div>
                                              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-none font-heading">
                                                  {isRTL ? 'الانحياز المؤسسي الذكي' : 'Institutional Bias & Flow'}
                                              </h3>
                                              <span className="text-[11px] text-slate-400 mt-1 inline-block">
                                                  {isRTL ? 'قراءة هيكلية لتدفق السيولة وتمركز كبار الفاعلين' : 'Structural Order Flow & Smart Money Direction'}
                                              </span>
                                          </div>
                                      </div>
                                      <div className="mt-4 p-4 sm:p-5 bg-slate-950/60 rounded-2xl border border-white/5 relative">
                                          <p className="text-slate-200 text-sm leading-relaxed font-medium">{parsedData.institutional_bias}</p>
                                      </div>
                                  </div>

                                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                                      <span className="flex items-center gap-1.5 text-blue-400">
                                          <Zap className="w-3.5 h-3.5" />
                                          {isRTL ? 'تحليل تدفق السيولة المؤسسية' : 'Institutional Flow Reading'}
                                      </span>
                                      <span className="font-mono text-slate-500">SMC Framework</span>
                                  </div>
                              </div>
                          </motion.div>
                      )}

                      {/* Key Levels & Liquidity Map — Ultra-Creative Institutional Design */}
                      {parsedData.key_levels && (() => {
                          const rawLevels = parsedData.key_levels;

                          // Helper: Parse numerical spot price
                          const spotRaw = rawLevels.current_price || '';
                          const spotMatch = (spotRaw || '').match(/([$€£¥]?\s*[\d,]+(?:\.\d+)?)/);
                          const spotPriceStr = spotMatch ? spotMatch[1].trim() : (spotRaw || '--');
                          const spotNum = spotMatch ? (parseFloat(spotMatch[1].replace(/[^0-9.-]+/g, '')) || null) : null;

                          // Helper: Parse individual level
                          const parseLevel = (
                              rawStr: string | undefined, 
                              code: string, 
                              titleEn: string, 
                              titleAr: string, 
                              type: 'resistance' | 'support' | 'pivot'
                          ) => {
                              if (!rawStr || rawStr === '--') return null;
                              const clean = rawStr.trim();
                              if (!clean) return null;

                              const regex = /^([$€£¥]?\s*[\d,]+(?:\.\d+)?)\s*(?:[-–—:|/]\s*(.*))?$/;
                              const match = clean.match(regex);
                              let price = '';
                              let note = '';

                              if (match) {
                                  price = match[1].trim();
                                  note = (match[2] || '').trim();
                              } else {
                                  const numMatch = clean.match(/([$€£¥]?\s*[\d,]+(?:\.\d+)?)/);
                                  if (numMatch) {
                                      price = numMatch[1].trim();
                                      note = clean.replace(price, '').replace(/^[-–—:|/\s]+|[-–—:|/\s]+$/g, '').trim();
                                  } else {
                                      price = clean;
                                  }
                              }

                              const numPrice = parseFloat(price.replace(/[^0-9.-]+/g, '')) || null;
                              
                              // Clean repetitive prefix if AI repeated level code
                              let cleanNote = note;
                              if (cleanNote) {
                                  cleanNote = cleanNote.replace(/^(?:Major|Tactical|Structural|Daily|Weekly|Monthly)?\s*(?:R[123]|S[123]|Resistance|Support|Pivot|Equilibrium)\s*[-/:]?\s*/i, '').trim();
                                  if (!cleanNote) cleanNote = note;
                              }

                              let distancePct: number | null = null;
                              let distanceAbs: number | null = null;
                              if (numPrice !== null && spotNum !== null && spotNum > 0) {
                                  distanceAbs = numPrice - spotNum;
                                  distancePct = ((numPrice - spotNum) / spotNum) * 100;
                              }

                              return {
                                  id: code,
                                  code,
                                  type,
                                  titleEn,
                                  titleAr,
                                  raw: clean,
                                  price,
                                  numPrice,
                                  note: cleanNote || (type === 'resistance' ? (isRTL ? 'منطقة سيولة بيعية' : 'Supply Liquidity Pool') : type === 'support' ? (isRTL ? 'كتلة أوامر شرائية' : 'Demand Order Block') : (isRTL ? 'نقطة التوازن اليومي' : 'Daily Fair Value')),
                                  distancePct,
                                  distanceAbs
                              };
                          };

                          const r2 = parseLevel(rawLevels.resistance_2, 'R2', 'Major Resistance (R2)', 'مقاومة رئيسية (R2)', 'resistance');
                          const r1 = parseLevel(rawLevels.resistance, 'R1', 'Tactical Resistance (R1)', 'مقاومة قريبة (R1)', 'resistance');
                          const pivot = parseLevel(rawLevels.pivot_point, 'PIVOT', 'Institutional Pivot', 'النقطة المحورية المؤسسية', 'pivot');
                          const s1 = parseLevel(rawLevels.support, 'S1', 'Tactical Support (S1)', 'دعم قريب (S1)', 'support');
                          const s2 = parseLevel(rawLevels.support_2, 'S2', 'Major Support (S2)', 'دعم رئيسي (S2)', 'support');

                          // Calculate spot gauge percentage between S1 and R1
                          let spotGaugePct = 50;
                          if (spotNum != null && s1?.numPrice != null && r1?.numPrice != null && r1.numPrice > s1.numPrice) {
                              const rawPct = ((spotNum - s1.numPrice) / (r1.numPrice - s1.numPrice)) * 100;
                              spotGaugePct = Math.max(8, Math.min(92, rawPct));
                          }

                          // Market regime evaluation (guarded against null pivot)
                          const hasPivotPrice = Boolean(spotNum != null && pivot?.numPrice != null);
                          const isAbovePivot = Boolean(hasPivotPrice && pivot?.numPrice != null && spotNum! >= pivot.numPrice);
                          const isBelowPivot = Boolean(hasPivotPrice && pivot?.numPrice != null && spotNum! < pivot.numPrice);
                          const regimeTextEn = isAbovePivot ? 'Premium Zone (Bullish Bias)' : isBelowPivot ? 'Discount Zone (Value Hunting)' : 'Equilibrium Zone';
                          const regimeTextAr = isAbovePivot ? 'منطقة علاوة (انحياز شرائي)' : isBelowPivot ? 'منطقة خصم (بحث عن قيمة)' : 'منطقة توازن سعري';

                          const copyToClipboard = (text: string, id: string) => {
                              navigator.clipboard.writeText(text);
                              setCopiedLevelId(id);
                              setTimeout(() => setCopiedLevelId(null), 1800);
                          };

                          // Render single level row (full width, spacious, luxury typography)
                          const renderLevelRow = (level: ReturnType<typeof parseLevel>, isTop = false, isBottom = false) => {
                              if (!level) return null;
                              const isRes = level.type === 'resistance';
                              const isSup = level.type === 'support';
                              const isPiv = level.type === 'pivot';
                              const isCopied = copiedLevelId === level.id;

                              const borderTheme = isRes 
                                  ? (level.code === 'R2' ? 'border-rose-500/30 hover:border-rose-500/60 bg-gradient-to-r from-rose-950/20 via-slate-900/60 to-slate-900/40' : 'border-rose-500/20 hover:border-rose-500/40 bg-slate-900/60')
                                  : isSup 
                                  ? (level.code === 'S2' ? 'border-teal-500/30 hover:border-teal-500/60 bg-gradient-to-r from-teal-950/20 via-slate-900/60 to-slate-900/40' : 'border-emerald-500/20 hover:border-emerald-500/40 bg-slate-900/60')
                                  : 'border-purple-500/30 hover:border-purple-500/50 bg-gradient-to-r from-purple-950/20 via-slate-900/60 to-slate-900/40';

                              const badgeTheme = isRes 
                                  ? (level.code === 'R2' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-rose-500/10 text-rose-300 border-rose-500/30')
                                  : isSup 
                                  ? (level.code === 'S2' ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30')
                                  : 'bg-purple-500/20 text-purple-300 border-purple-500/40';

                              const priceColor = isRes 
                                  ? 'text-rose-300 group-hover/row:text-rose-200' 
                                  : isSup 
                                  ? 'text-emerald-300 group-hover/row:text-emerald-200' 
                                  : 'text-purple-300 group-hover/row:text-purple-200';

                              return (
                                  <div 
                                      key={level.id}
                                      className={`group/row relative p-3.5 sm:p-4 rounded-2xl border ${borderTheme} transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm`}
                                  >
                                      {/* Left side: Badge & Level Info */}
                                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                                          <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold tracking-tight border shrink-0 ${badgeTheme}`}>
                                              {level.code}
                                          </div>
                                          <div className="flex flex-col min-w-0">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                                                      {isRTL ? level.titleAr : level.titleEn}
                                                  </span>
                                                  {level.distancePct !== null && (
                                                      <span className={`inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border ${
                                                          level.distancePct > 0 
                                                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/25' 
                                                              : level.distancePct < 0 
                                                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                                                              : 'bg-blue-500/10 text-blue-300 border-blue-500/25'
                                                      }`}>
                                                          {level.distancePct > 0 ? (
                                                              <ArrowUpRight className="w-3 h-3 shrink-0" />
                                                          ) : level.distancePct < 0 ? (
                                                              <ArrowDownRight className="w-3 h-3 shrink-0" />
                                                          ) : null}
                                                          {level.distancePct > 0 ? `+${level.distancePct.toFixed(2)}%` : `${level.distancePct.toFixed(2)}%`}
                                                      </span>
                                                  )}
                                              </div>
                                              {level.note && (
                                                  <span className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-snug line-clamp-1">
                                                      {level.note}
                                                  </span>
                                              )}
                                          </div>
                                      </div>

                                      {/* Right side: Price & Copy Action */}
                                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                                          <div className="flex flex-col sm:items-end">
                                              <span className={`text-base sm:text-lg font-mono font-bold tracking-tight transition-colors ${priceColor}`}>
                                                  {level.price}
                                              </span>
                                              {level.distanceAbs !== null && (
                                                  <span className="text-[10px] font-mono text-slate-500">
                                                      {level.distanceAbs > 0 ? `+${level.distanceAbs.toFixed(2)} pts` : `${level.distanceAbs.toFixed(2)} pts`}
                                                  </span>
                                              )}
                                          </div>

                                          <button
                                              onClick={() => copyToClipboard(level.price, level.id)}
                                              title={isRTL ? 'نسخ السعر للحافظة' : 'Copy price to clipboard'}
                                              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/10 transition-all shrink-0 active:scale-95"
                                          >
                                              {isCopied ? (
                                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                              ) : (
                                                  <Copy className="w-3.5 h-3.5" />
                                              )}
                                          </button>
                                      </div>
                                  </div>
                              );
                          };

                          return (
                              <motion.div 
                                  variants={itemVariants} 
                                  className={`bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950/95 border border-white/10 rounded-3xl p-5 sm:p-6 lg:p-7 relative overflow-hidden flex flex-col justify-between shadow-2xl backdrop-blur-xl group hover:border-white/15 transition-all duration-300 ${!parsedData.institutional_bias ? 'lg:col-span-2' : ''}`}
                              >
                                  {/* Ambient background glows */}
                                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-rose-500/5 blur-3xl pointer-events-none rounded-full"></div>
                                  <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full"></div>

                                  <div className="relative z-10 flex flex-col gap-4">
                                      {/* Header with Title, Spot Price Pill & View Toggle */}
                                      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-white/5">
                                          <div className="flex items-center gap-2.5">
                                              <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-blue-500/10 rounded-2xl border border-purple-500/30 text-purple-300 shadow-md">
                                                  <Scale className="w-4 h-4 text-purple-400" />
                                              </div>
                                              <div>
                                                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-none font-heading">
                                                      {isRTL ? 'المستويات السعرية وخريطة السيولة' : 'Key Levels & Liquidity Map'}
                                                  </h3>
                                                  <span className="text-[11px] text-slate-400 mt-1 inline-block">
                                                      {isRTL ? 'توزيع كتل الأوامر والدعوم والمقاومات المؤسسية' : 'Institutional Order Blocks & Target Corridors'}
                                                  </span>
                                              </div>
                                          </div>

                                          <div className="flex items-center gap-2 flex-wrap">
                                              {/* Spot Price Pill */}
                                              {spotPriceStr !== '--' && (
                                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl shadow-sm">
                                                      <span className="relative flex h-2 w-2">
                                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
                                                      </span>
                                                      <span className="text-xs font-mono font-bold text-blue-200">
                                                          {isRTL ? `السعر اللحظي: ${spotPriceStr}` : `Spot: ${spotPriceStr}`}
                                                      </span>
                                                  </div>
                                              )}

                                              {/* View Toggle (Ladder vs Zones) */}
                                              <div className="flex items-center p-0.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs">
                                                  <button
                                                      onClick={() => setKeyLevelsView('ladder')}
                                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                                                          keyLevelsView === 'ladder'
                                                              ? 'bg-purple-600 text-white shadow-sm'
                                                              : 'text-slate-400 hover:text-slate-200'
                                                      }`}
                                                      title={isRTL ? 'عرض سلّم الأسعار' : 'Ladder View'}
                                                  >
                                                      <Layers className="w-3.5 h-3.5" />
                                                      <span>{isRTL ? 'سلّم الأسعار' : 'Ladder'}</span>
                                                  </button>
                                                  <button
                                                      onClick={() => setKeyLevelsView('zones')}
                                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                                                          keyLevelsView === 'zones'
                                                              ? 'bg-purple-600 text-white shadow-sm'
                                                              : 'text-slate-400 hover:text-slate-200'
                                                      }`}
                                                      title={isRTL ? 'عرض المناطق المؤسسية' : 'Zones View'}
                                                  >
                                                      <Target className="w-3.5 h-3.5" />
                                                      <span>{isRTL ? 'المناطق' : 'Zones'}</span>
                                                  </button>
                                              </div>
                                          </div>
                                      </div>

                                      {/* Creative Market Position Gauge (Equilibrium / Premium vs Discount) */}
                                      <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-white/5 space-y-2.5">
                                          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                                              <div className="flex items-center gap-2">
                                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                      isAbovePivot 
                                                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' 
                                                          : isBelowPivot 
                                                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                                          : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                                  }`}>
                                                      {isRTL ? regimeTextAr : regimeTextEn}
                                                  </span>
                                              </div>

                                              {s1?.numPrice != null && r1?.numPrice != null && (
                                                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                                                      {s1.distancePct !== null && (
                                                          <span>
                                                              {isRTL ? 'إلى الدعم S1: ' : 'To S1: '}
                                                              <strong className="text-emerald-400">{s1.distancePct.toFixed(2)}%</strong>
                                                          </span>
                                                      )}
                                                      <span className="text-slate-600">•</span>
                                                      {r1.distancePct !== null && (
                                                          <span>
                                                              {isRTL ? 'إلى المقاومة R1: ' : 'To R1: '}
                                                              <strong className="text-rose-400">+{r1.distancePct.toFixed(2)}%</strong>
                                                          </span>
                                                      )}
                                                  </div>
                                              )}
                                          </div>

                                          {/* Range Progress Bar from S1 -> Pivot -> R1 */}
                                          {s1?.numPrice != null && r1?.numPrice != null && (
                                              <div className="space-y-1">
                                                  <div className="relative w-full h-2.5 bg-slate-900 rounded-full border border-white/10 overflow-hidden">
                                                      {/* Gradient background track */}
                                                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/40 via-purple-500/40 to-rose-500/40"></div>
                                                      {/* Center Pivot Marker */}
                                                      <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-purple-400/80 -translate-x-1/2 z-10"></div>
                                                      {/* Current Spot Indicator */}
                                                      <div 
                                                          className="absolute top-0 bottom-0 w-2.5 h-2.5 rounded-full bg-blue-300 border-2 border-slate-950 shadow-[0_0_8px_rgba(59,130,246,1)] -translate-x-1/2 transition-all duration-500 z-20"
                                                          style={{ left: `${spotGaugePct}%` }}
                                                      ></div>
                                                  </div>
                                                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-0.5">
                                                      <span>S1: {s1.price}</span>
                                                      <span className="text-purple-300/80">{pivot ? `Pivot: ${pivot.price}` : 'Fair Value'}</span>
                                                      <span>R1: {r1.price}</span>
                                                  </div>
                                              </div>
                                          )}
                                      </div>

                                      {/* VIEW MODE 1: LADDER VIEW (Vertical Price Ladder from R2 down to S2) */}
                                      {keyLevelsView === 'ladder' && (
                                          <div className="flex flex-col gap-2.5">
                                              {/* Resistance Ceiling: R2 */}
                                              {r2 && renderLevelRow(r2, true, false)}

                                              {/* Near Resistance: R1 */}
                                              {r1 && renderLevelRow(r1, false, false)}

                                              {/* Spot Price Visual Divider Corridor */}
                                              <div className="my-1 p-2.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs shadow-inner">
                                                  <div className="flex items-center gap-2">
                                                      <span className="relative flex h-2 w-2">
                                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
                                                      </span>
                                                      <span className="font-semibold text-blue-200">
                                                          {isRTL ? 'موقع السعر اللحظي (Spot Price)' : 'Current Market Spot'}
                                                      </span>
                                                  </div>
                                                  <span className="font-mono font-extrabold text-blue-100 text-sm">
                                                      {spotPriceStr}
                                                  </span>
                                              </div>

                                              {/* Central Equilibrium Pivot */}
                                              {pivot && renderLevelRow(pivot, false, false)}

                                              {/* Near Support: S1 */}
                                              {s1 && renderLevelRow(s1, false, false)}

                                              {/* Support Floor: S2 */}
                                              {s2 && renderLevelRow(s2, false, true)}
                                          </div>
                                      )}

                                      {/* VIEW MODE 2: ZONES VIEW (Grouped Supply vs Demand Blocks) */}
                                      {keyLevelsView === 'zones' && (
                                          <div className="flex flex-col gap-4">
                                              {/* Supply / Resistance Zone */}
                                              <div className="p-4 bg-slate-950/50 rounded-2xl border border-rose-500/20 space-y-3">
                                                  <div className="flex items-center justify-between text-xs font-semibold text-rose-400 pb-2 border-b border-rose-500/10">
                                                      <span className="flex items-center gap-2">
                                                          <TrendingUp className="w-4 h-4 text-rose-400" />
                                                          {isRTL ? 'مناطق العرض والسيولة البيعية (Resistance Zone)' : 'Supply & Resistance Zone'}
                                                      </span>
                                                      <span className="text-[11px] font-mono text-slate-500">Sell Targets</span>
                                                  </div>
                                                  <div className="space-y-2">
                                                      {r2 && renderLevelRow(r2)}
                                                      {r1 && renderLevelRow(r1)}
                                                  </div>
                                              </div>

                                              {/* Pivot Equilibrium if present */}
                                              {pivot && (
                                                  <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/20">
                                                      {renderLevelRow(pivot)}
                                                  </div>
                                              )}

                                              {/* Demand / Support Zone */}
                                              <div className="p-4 bg-slate-950/50 rounded-2xl border border-emerald-500/20 space-y-3">
                                                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 pb-2 border-b border-emerald-500/10">
                                                      <span className="flex items-center gap-2">
                                                          <TrendingDown className="w-4 h-4 text-emerald-400" />
                                                          {isRTL ? 'مناطق الطلب والدعوم المؤسسية (Support Zone)' : 'Demand & Support Zone'}
                                                      </span>
                                                      <span className="text-[11px] font-mono text-slate-500">Buy Targets</span>
                                                  </div>
                                                  <div className="space-y-2">
                                                      {s1 && renderLevelRow(s1)}
                                                      {s2 && renderLevelRow(s2)}
                                                  </div>
                                              </div>
                                          </div>
                                      )}

                                      {/* Invalidation Level if provided */}
                                      {rawLevels.invalidation_level && rawLevels.invalidation_level !== '--' && (
                                          <div className="mt-1 p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between text-xs text-rose-200">
                                              <span className="font-medium flex items-center gap-1.5">
                                                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                                                  {isRTL ? 'مستوى إلغاء السيناريو (Invalidation Level)' : 'Scenario Invalidation Level'}
                                              </span>
                                              <span className="font-mono font-bold text-rose-300">
                                                  {rawLevels.invalidation_level}
                                              </span>
                                          </div>
                                      )}
                                  </div>
                              </motion.div>
                          );
                      })()}
                  </motion.div>
              ) : isLoading ? (
                  <motion.div variants={itemVariants} className="bg-slate-900/30 border border-dashed border-white/10 rounded-3xl p-6 flex items-center justify-center gap-3">
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                      <span className="text-xs font-mono text-slate-400">
                          {isRTL ? 'جاري بث المستويات السعرية والدعوم والمقاومات المؤسسية...' : 'Streaming Key Institutional Support & Resistance Levels...'}
                      </span>
                  </motion.div>
              ) : null}

              {/* Third Row: Global Context (Placed ABOVE Trader's Playbook) */}
              {parsedData.global_context ? (
                  <motion.div variants={containerVariants} className="bg-slate-800/30 border border-white/5 rounded-3xl p-6 lg:p-8">
                      <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6 text-emerald-400">
                          <div className="p-2 bg-emerald-500/10 rounded-xl">
                            <Globe className="w-5 h-5" />
                          </div>
                          <h3 className="text-lg font-medium text-white font-heading tracking-tight">
                              {isRTL ? 'السياق المالي العالمي والتأثير الأسبوعي' : 'Global Context & Weekly Impact'}
                          </h3>
                      </motion.div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <motion.div variants={itemVariants} className="space-y-3">
                              <div className="text-xs font-medium text-slate-400 mb-2">
                                  {isRTL ? 'أبرز العناوين الإخبارية' : 'News Highlights'}
                              </div>
                              {parsedData.global_context.news_highlights.map((news, i) => (
                                  <div key={i} className="flex gap-3 text-sm text-slate-300 font-medium">
                                      <Minus className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                      <span className="leading-relaxed">{news}</span>
                                  </div>
                              ))}
                          </motion.div>
                          
                          <motion.div variants={itemVariants} className="bg-slate-900/50 p-5 rounded-2xl border border-white/5">
                              <div className="text-xs font-medium text-slate-400 mb-3">
                                  {isRTL ? 'التأثير الأسبوعي المؤسسي' : 'Weekly Impact'}
                              </div>
                              <p className="text-sm text-slate-300 font-medium leading-relaxed">{parsedData.global_context.weekly_impact}</p>
                          </motion.div>
                      </div>
                  </motion.div>
              ) : isLoading ? (
                  <motion.div variants={itemVariants} className="bg-slate-900/30 border border-dashed border-white/10 rounded-3xl p-6 flex items-center justify-center gap-3">
                      <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span className="text-xs font-mono text-slate-400">
                          {isRTL ? 'جاري بث السياق المالي العالمي والمؤشرات الاقتصادية...' : 'Streaming Global Macro Context & Sentiment Index...'}
                      </span>
                  </motion.div>
              ) : null}

              {/* Fourth Row: Trader's Playbook (Placed below Global Context, stacked sequentially, clean formatting) */}
              {(parsedData.playbook && parsedData.playbook.length > 0) ? (() => {
                  const isItemHoliday = (ev: PlaybookEvent) => {
                      const eventText = ev.event || '';
                      const forecastText = ev.forecast || '';
                      const whyText = ev.why || '';
                      return ev.impact === 'Holiday' || 
                             /holiday|bank closure|closure|day off/i.test(eventText) || 
                             /holiday|bank closure|closure/i.test(forecastText) ||
                             /holiday|bank closure|closure/i.test(whyText);
                  };

                  const getEventCountry = (ev: PlaybookEvent) => {
                      if (ev.country) return ev.country;
                      const eventStr = ev.event || '';
                      const bracketMatch = eventStr.match(/\[([A-Z]{2,3})\]/);
                      if (bracketMatch) return bracketMatch[1];
                      const prefixMatch = eventStr.match(/^([A-Z]{2,3})\s/);
                      if (prefixMatch) return prefixMatch[1];
                      return 'USD';
                  };

                  const cleanEventTitle = (title: string) => {
                      if (!title) return 'Scheduled Event';
                      return title.replace(/^\[[A-Z]{2,3}\]\s*/, '').replace(/^[A-Z]{2,3}\s*-\s*/, '').trim();
                  };

                  const rawPlaybook = (parsedData.playbook || []).filter(Boolean);

                  return (
                      <motion.div variants={containerVariants} className="space-y-4">
                          {/* Playbook Header */}
                          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                              <div className="flex items-center gap-3">
                                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600/20 via-slate-800 to-sky-500/10 border border-blue-500/30 text-blue-400 shrink-0 shadow-lg shadow-blue-950/30">
                                      <Target className="w-5 h-5 text-blue-400" />
                                  </div>
                                  <div>
                                      <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-none font-heading">
                                          {isRTL ? 'خطة تداول الأخبار المرتقبة' : "Trader's Playbook"}
                                      </h3>
                                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                          <span>
                                              {isRTL ? 'أهم الأحداث الاقتصادية والمحركات السعرية' : 'Scheduled Economic Events & Market Catalysts'}
                                          </span>
                                          {ffLastSynced && (
                                              <>
                                                  <span className="text-slate-600">•</span>
                                                  <span className="text-slate-500 font-mono text-[11px]">
                                                      {isRTL ? 'تم التحديث ' : 'Updated '} {ffLastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                  </span>
                                              </>
                                          )}
                                      </div>
                                  </div>
                              </div>

                              {/* Refresh Button */}
                              <div className="flex items-center gap-2">
                                  <button
                                      onClick={() => fetchForexFactoryCalendar(true)}
                                      disabled={isSyncingFF}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white border border-white/10 hover:border-blue-500/40 transition-all text-xs font-medium active:scale-95 disabled:opacity-50"
                                      title={isRTL ? 'تحديث الأخبار الاقتصادية' : 'Refresh economic events'}
                                  >
                                      <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncingFF ? 'animate-spin' : ''}`} />
                                      <span>{isSyncingFF ? (isRTL ? 'جاري التحديث...' : 'Syncing...') : (isRTL ? 'تحديث الأحداث' : 'Refresh Events')}</span>
                                  </button>
                              </div>
                          </motion.div>

                          {/* Playbook Cards - Vertical Stack in Unified Shades of Blue */}
                          <div className="flex flex-col gap-4">
                              {rawPlaybook.map((event, idx) => {
                                  const isHoliday = isItemHoliday(event);
                                  const country = getEventCountry(event);
                                  const cleanTitle = cleanEventTitle(event.event);

                                  return (
                                      <motion.div 
                                          variants={itemVariants} 
                                          key={idx} 
                                          className={`rounded-3xl border overflow-hidden relative group transition-all duration-300 backdrop-blur-md ${
                                              isHoliday 
                                                  ? 'bg-gradient-to-br from-sky-950/30 via-slate-900/85 to-blue-950/20 border-sky-500/30 shadow-lg shadow-sky-950/20' 
                                                  : 'bg-gradient-to-br from-slate-900/90 via-slate-900/75 to-blue-950/25 border-blue-500/20 hover:border-blue-500/40 shadow-lg shadow-slate-950/40'
                                          }`}
                                      >
                                          <div className="p-5 sm:p-6 relative z-10 flex flex-col gap-4">
                                              <div>
                                                  {/* Badges Row */}
                                                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
                                                      <div className="flex items-center gap-2">
                                                          {isHoliday && (
                                                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-normal bg-sky-500/15 border border-sky-500/30 text-sky-300 shadow-sm shadow-sky-950/50">
                                                                  <Landmark className="w-3.5 h-3.5 text-sky-400" />
                                                                  {isRTL ? 'عطلة بنكية' : 'Bank Holiday'}
                                                              </span>
                                                          )}

                                                          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-500/20 text-blue-200 border border-blue-500/30 tracking-wider">
                                                              {country}
                                                          </span>
                                                      </div>

                                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium text-blue-200/80 bg-blue-950/40 border border-blue-500/20">
                                                          <Clock className="w-3 h-3 text-blue-400" />
                                                          {event.date || (isRTL ? 'هذا الأسبوع' : 'This Week')}
                                                      </span>
                                                  </div>

                                                  {/* Event Name */}
                                                  <h4 className="text-lg sm:text-xl font-semibold text-white tracking-tight leading-snug group-hover:text-blue-200 transition-colors font-heading">
                                                      {cleanTitle}
                                                  </h4>
                                              </div>

                                              {/* Metrics Box: Forecast & Tactical Plan (Unified Blue Tones) */}
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                  <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-blue-500/10">
                                                      <div className="text-[11px] text-blue-300/80 mb-1 font-medium">
                                                          {isHoliday ? (isRTL ? 'حالة السوق والسيولة' : 'Market Condition') : (isRTL ? 'التوقع' : 'Forecast')}
                                                      </div>
                                                      <div className="font-mono text-sm text-slate-200 font-semibold tracking-tight tabular-nums">
                                                          {event.forecast || '--'}
                                                      </div>
                                                  </div>
                                                  <div className="bg-blue-950/30 rounded-2xl p-3.5 border border-blue-500/25">
                                                      <div className="text-[11px] text-sky-400 mb-1 font-medium">
                                                          {isRTL ? 'الخطة التكتيكية المقترحة' : 'Tactical Plan'}
                                                      </div>
                                                      <div className="text-sm text-sky-200 font-semibold leading-tight">
                                                          {event.plan || '--'}
                                                      </div>
                                                  </div>
                                              </div>
                                              
                                              {/* Action Timing & Deviation Risk (In Blue/Sky/Indigo shades) */}
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                  <div className="bg-slate-950/40 rounded-xl px-3.5 py-2.5 border border-blue-500/15">
                                                      <div className="text-[11px] text-blue-300/80 mb-1 font-medium">
                                                          {isRTL ? 'توقيت التنفيذ' : 'When to Act'}
                                                      </div>
                                                      <div className="text-xs text-slate-200 leading-relaxed font-normal">
                                                          {event.when_to_act || (isRTL ? 'مراقبة حركة السعر وتدفق الأوامر عند الإعلان.' : 'Monitor price action and order flow around release.')}
                                                      </div>
                                                  </div>

                                                  <div className={`rounded-xl px-3.5 py-2.5 border ${
                                                      isHoliday 
                                                          ? 'bg-sky-950/25 border-sky-500/30 text-sky-200/90' 
                                                          : 'bg-blue-950/30 border-blue-500/30 text-blue-200/90'
                                                  }`}>
                                                      <div className={`text-[11px] mb-1 font-medium ${
                                                          isHoliday ? 'text-sky-300' : 'text-blue-300'
                                                      }`}>
                                                          {isHoliday ? (isRTL ? 'تحذير السيولة والتنفيذ' : 'Liquidity & Execution Warning') : (isRTL ? 'المخاطر في حال المفاجأة' : 'Risk If Actual Deviates')}
                                                      </div>
                                                      <div className="text-xs leading-relaxed font-normal text-slate-200">
                                                          {event.impact_if_deviates || (isHoliday ? (isRTL ? 'انخفاض في السيولة واتساع متوقع في الفوارق السعرية (Spread).' : 'Thin market liquidity; wider spreads expected.') : (isRTL ? 'تقلبات حادة متوقعة في حال صدور قراءة مفاجئة.' : 'Rapid volatility and spread expansion expected on significant surprise.'))}
                                                      </div>
                                                  </div>
                                              </div>

                                              {/* Reason / Context if present */}
                                              {event.why && (
                                                  <div className="pt-2 border-t border-white/5 text-[11px] text-blue-300/70 italic">
                                                      {event.why}
                                                  </div>
                                              )}
                                          </div>
                                      </motion.div>
                                  );
                              })}
                          </div>

                          {/* Optional toggle for Full Weekly Economic Calendar Schedule */}
                          {ffEvents.length > 0 && (
                              <div className="pt-2">
                                  <button
                                      onClick={() => setShowLiveCalendarFeed(!showLiveCalendarFeed)}
                                      className="w-full flex items-center justify-between p-3.5 bg-slate-900/40 hover:bg-slate-900/60 border border-white/5 hover:border-blue-500/30 rounded-2xl transition-all text-xs text-slate-300 group"
                                  >
                                      <div className="flex items-center gap-2">
                                          <Calendar className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                                          <span className="font-medium text-white">
                                              {showLiveCalendarFeed 
                                                  ? (isRTL ? 'إخفاء الأجندة الاقتصادية للأسبوع' : 'Hide Weekly Economic Schedule') 
                                                  : (isRTL ? `استعراض الأجندة الاقتصادية الكاملة للأسبوع (${ffEvents.length} حدثاً وعطلة)` : `Explore Full Weekly Economic Calendar Schedule (${ffEvents.length} Events & Holidays)`)}
                                          </span>
                                      </div>
                                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showLiveCalendarFeed ? 'rotate-180' : ''}`} />
                                  </button>

                                  {showLiveCalendarFeed && (
                                      <motion.div 
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          className="mt-3 bg-slate-950/60 border border-blue-500/20 rounded-2xl p-4 overflow-hidden"
                                      >
                                          <div className="text-xs font-semibold text-blue-300 mb-3">
                                              {isRTL ? 'الأجندة الاقتصادية الأسبوعية' : 'Weekly Economic Schedule'}
                                          </div>
                                          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                                              {ffEvents.map((ev, i) => (
                                                  <div key={ev.id || i} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900/50 border border-blue-500/10 text-xs">
                                                      <div className="flex items-center gap-2.5 min-w-0">
                                                          {ev.impact === 'Holiday' ? (
                                                              <span className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 shrink-0">
                                                                  <Landmark className="w-3.5 h-3.5" />
                                                              </span>
                                                          ) : (
                                                              <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                                                                  <Flame className="w-3.5 h-3.5 text-blue-400" />
                                                              </span>
                                                          )}
                                                          <span className="font-mono font-bold text-blue-200 px-1.5 py-0.5 rounded bg-blue-500/20 text-[11px] shrink-0 border border-blue-500/30">
                                                              {ev.country}
                                                          </span>
                                                          <span className="font-medium text-slate-200 truncate">
                                                              {ev.title}
                                                          </span>
                                                      </div>
                                                      <div className="flex items-center gap-3 shrink-0 text-slate-400 font-mono text-[11px]">
                                                          {ev.forecast && (
                                                              <span>{isRTL ? 'التوقع: ' : 'F: '}<strong className="text-blue-300">{ev.forecast}</strong></span>
                                                          )}
                                                          {ev.previous && (
                                                              <span>{isRTL ? 'السابق: ' : 'P: '}<span className="text-slate-400">{ev.previous}</span></span>
                                                          )}
                                                          <span className="text-slate-500">
                                                              {ev.date ? new Date(ev.date).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
                                                          </span>
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      </motion.div>
                                  )}
                              </div>
                          )}
                      </motion.div>
                  );
              })() : isLoading ? (
                  <motion.div variants={itemVariants} className="bg-slate-900/30 border border-dashed border-white/10 rounded-3xl p-6 flex items-center justify-center gap-3">
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      <span className="text-xs font-mono text-slate-400">
                          {isRTL ? 'جاري بث خطة تداول الأحداث المرتقبة...' : 'Streaming Tactical Event Playbook...'}
                      </span>
                  </motion.div>
              ) : null}
          </motion.div>
      );
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xl transition-opacity duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl bg-slate-900/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200 ring-1 ring-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Background Glows & Noise */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-900/40 relative z-20 shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-5">
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                <div className="relative p-3.5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300">
                    <Bot className="w-8 h-8 text-blue-400 group-hover:text-white transition-colors" />
                </div>
            </div>
            <div>
                <h3 className="text-2xl font-medium text-white font-heading tracking-tight leading-none mb-1">AI Market Mentor</h3>
                <div className="flex items-center gap-2">
                    <span className="flex w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Live Analysis</p>
                </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Language Dropdown */}
            <div className="relative" ref={langMenuRef}>
                <button
                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/60 hover:bg-slate-700/60 rounded-xl border border-white/10 text-xs font-medium text-slate-200 transition-all hover:border-white/20 active:scale-95 shadow-sm"
                >
                    <Languages className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-semibold">{currentLang === 'Arabic' ? 'العربية' : currentLang}</span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLangMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/50 divide-y divide-white/5">
                        {[
                            { id: 'English', label: 'English', sub: 'Default (EN)' },
                            { id: 'Arabic', label: 'العربية', sub: 'ترجمة فورية فائقة السرعة' },
                            { id: 'French', label: 'Français', sub: 'French (FR)' }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleLanguageChange(item.id)}
                                className={`w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-white/5 transition-colors flex items-center justify-between
                                    ${currentLang === item.id ? 'text-blue-400 bg-blue-500/10' : 'text-slate-300'}
                                `}
                            >
                                <div className="flex flex-col text-left">
                                    <span className="font-semibold text-slate-200">{item.label}</span>
                                    <span className="text-[10px] text-slate-500">{item.sub}</span>
                                </div>
                                {currentLang === item.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-white/5 text-xs text-slate-400">
                <Target className="w-3.5 h-3.5 text-white" />
                <span>Target: <span className="text-white font-medium tracking-wide">{title}</span></span>
            </div>

            {/* Voice Button */}
            {!isLoading && !isTranslating && parsedData && (
                <button 
                    onClick={toggleVoice}
                    className={`p-2.5 rounded-xl transition-colors border active:scale-95 flex items-center justify-center ${
                        isPlayingVoice 
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30' 
                            : 'bg-slate-800/50 text-slate-400 hover:text-white border-white/5 hover:border-white/10 hover:bg-slate-700/50'
                    }`}
                    title={isPlayingVoice ? "Stop Audio" : "Listen to Analysis"}
                >
                    {isPlayingVoice ? <VolumeX className="w-5 h-5 animate-pulse" /> : <Volume2 className="w-5 h-5" />}
                </button>
            )}

            <button 
                onClick={onClose} 
                className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors border border-transparent hover:border-white/5 active:scale-95"
            >
                <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div 
            dir={currentLang === 'Arabic' ? 'rtl' : 'ltr'} 
            className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 relative z-10"
        >
            {(isLoading || isTranslating) && !parsedData ? (
                <div className="flex flex-col items-center justify-center py-32 gap-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
                        <div className="relative z-10 p-6 bg-slate-900/50 rounded-full border border-white/10 shadow-2xl backdrop-blur-md">
                             <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
                        </div>
                    </div>
                    <div className="text-center space-y-4 max-w-sm mx-auto">
                        <h4 className="text-white font-medium text-2xl animate-pulse tracking-tight">
                            {isTranslating 
                                ? (currentLang === 'Arabic' ? "جاري الاتصال بمحرك الترجمة الفورية..." : `Connecting to ${currentLang} translation stream...`) 
                                : (isRTL ? "جاري الاتصال وبدء بث التحليل المؤسسي لحظياً..." : "Connecting to AI Live Stream...")}
                        </h4>
                        <div className="flex flex-col gap-2 items-center">
                             <div className="h-1.5 w-48 bg-slate-800 rounded-full overflow-hidden">
                                 <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 animate-progress w-full origin-left"></div>
                             </div>
                             <p className="text-slate-400 text-xs font-mono mt-2">
                                 {isTranslating 
                                     ? (currentLang === 'Arabic' ? "تهيئة البث المباشر للغة العربية..." : "Ultra-fast neural translation active...") 
                                     : "Initiating live incremental synthesis..."}
                             </p>
                        </div>
                    </div>
                </div>
            ) : (
                renderContent()
            )}
        </div>

        {/* Footer Actions */}
        {parsedData && (
            <div className="p-6 border-t border-white/5 bg-slate-900/80 backdrop-blur-xl flex justify-between items-center z-10 shrink-0 relative">
                <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2">
                    <Info className="w-3.5 h-3.5" />
                    {isLoading ? "Streaming live institutional insight in real-time..." : "AI analysis may vary. Always verify with your own research."}
                </div>
                <div className="flex gap-4 w-full sm:w-auto justify-end">
                    <button 
                        onClick={handleCopy}
                        disabled={isLoading || isTranslating}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all border ${
                            isLoading || isTranslating
                                ? 'bg-slate-800/30 text-slate-500 border-white/5 cursor-not-allowed'
                                : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white border-white/5 hover:border-white/10 active:scale-95'
                        }`}
                    >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Copied" : "Copy Analysis"}
                    </button>
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/25 active:scale-95 ring-1 ring-white/10"
                    >
                        Done
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default AIAnalysisOverlay;
