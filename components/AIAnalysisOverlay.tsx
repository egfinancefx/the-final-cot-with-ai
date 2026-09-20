
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Bot, Loader2, Sparkles, Copy, Check, TrendingUp, TrendingDown, Minus, Languages, ChevronDown, Calendar, Filter, Activity, Scale, Target, Zap, ArrowRight, AlertTriangle, Info, AlertOctagon, Globe, Newspaper, Brain, ShieldAlert, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';
import { SummaryRow } from '../types';
import { formatCurrency } from '../utils';

interface AIAnalysisOverlayProps {
  isAiOfflineMode?: boolean;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  analysis: string | null;
  title: string;
  data: SummaryRow | null;
}

interface PlaybookEvent {
    event: string;
    date: string;
    forecast: string;
    plan: string;
    why: string;
    when_to_act: string;
    impact_if_deviates: string;
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
  
  // Translation State
  const [currentLang, setCurrentLang] = useState('English');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Voice State
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

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
        try {
            // Attempt to parse JSON safely
            const cleanJson = analysis.replace(/```json\n?|\n?```/g, '').trim();
            if (cleanJson.startsWith('{') || cleanJson.startsWith('[')) {
                const data = JSON.parse(cleanJson);
                setParsedData(data);
            } else {
                setParsedData(null);
            }
        } catch (e) {
            console.warn("Could not parse AI JSON format:", e);
            setParsedData(null);
        }
        setCurrentLang('English');
    } else {
        setParsedData(null);
    }
  }, [analysis]);

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
    
    setCurrentLang(lang);

    if (lang === 'English') {
        if (analysis) {
             try {
                const cleanJson = analysis.replace(/```json\n?|\n?```/g, '').trim();
                if (cleanJson.startsWith('{') || cleanJson.startsWith('[')) {
                  setParsedData(JSON.parse(cleanJson));
                }
            } catch (e) {
                console.warn("Failed to parse original JSON:", e);
            }
        }
        return;
    }

    if (!parsedData) return;

    setIsTranslating(true);
    try {
        // Optimized prompt for speed
        const prompt = `Translate values to ${lang}. Return JSON only.
        ${JSON.stringify(parsedData)}`;

        const res = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemini-2.5-flash',
                prompt,
                responseMimeType: "application/json"
            })
        });

        const resData = await res.json();
        if (res.ok && resData.text) {
            try {
                const clean = resData.text.replace(/```json\n?|\n?```/g, '').trim();
                if (clean.startsWith('{') || clean.startsWith('[')) {
                    const translatedData = JSON.parse(clean);
                    setParsedData(translatedData);
                }
            } catch (parseErr) {
                console.warn("Could not parse translated JSON:", parseErr);
            }
        }
    } catch (error) {
        console.error("Translation failed:", error);
    } finally {
        setIsTranslating(false);
    }
  };

  const getSentimentColor = (label: string) => {
      const l = label.toLowerCase();
      if (l.includes('bullish') || l.includes('risk-on')) return 'emerald';
      if (l.includes('bearish') || l.includes('risk-off')) return 'rose';
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
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.96, filter: 'blur(4px)' },
    show: { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        filter: 'blur(0px)',
        transition: { type: "spring" as const, stiffness: 250, damping: 20 } 
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

      const sentimentColor = getSentimentColor(parsedData.sentiment.label);
      const isBullish = sentimentColor === 'emerald';
      const isBearish = sentimentColor === 'rose';

      return (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className={`flex flex-col gap-6 p-1 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
              {isAiOfflineMode && (
                  <motion.div variants={itemVariants} className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-start gap-3 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-500/5 to-rose-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                          <h4 className="text-rose-400 font-medium text-sm">Gemini API Quota Exceeded</h4>
                          <p className="text-rose-400/80 text-xs mt-1">
                              Your API key has hit its rate limit or quota. The analysis shown below is a generic, fallback report generated locally. Please check your Google AI Studio billing/plan, wait a moment, and try again.
                          </p>
                      </div>
                  </motion.div>
              )}
              
              {/* Top Row: Mentor's Perspective */}
              <motion.div variants={itemVariants} className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 relative overflow-hidden backdrop-blur-sm group hover:border-white/10 transition-all duration-500">
                  <div className={`absolute top-0 w-1.5 h-full bg-gradient-to-b from-blue-500 via-white to-blue-600 ${isRTL ? 'right-0' : 'left-0'}`}></div>
                  
                  <div className="flex items-start gap-5 mb-8">
                      <div className="p-3.5 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl shadow-lg shadow-blue-500/20 shrink-0 ring-1 ring-white/10">
                          <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div>
                          <h3 className="text-2xl font-medium text-white mb-2 font-heading tracking-tight">Mentor's Perspective</h3>
                          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">{parsedData.perspective}</p>
                      </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-500/10 to-blue-400/5 rounded-2xl p-6 border border-blue-500/10 relative overflow-hidden group-hover:border-blue-500/20 transition-colors">
                      <div className="absolute top-0 right-0 p-3 opacity-10">
                          <Target className="w-24 h-24 text-blue-400 -rotate-12" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3 text-white">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">If I Were You</span>
                        </div>
                        <p className="text-blue-50 text-lg font-medium leading-relaxed italic">
                            "{parsedData.actionable_advice}"
                        </p>
                      </div>
                  </div>
              </motion.div>

              {/* Second Row: Grid of 3 (Sentiment, Institutional Bias, Key Levels) */}
              <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Sentiment Card */}
                  <motion.div variants={itemVariants} className={`rounded-3xl p-8 border relative overflow-hidden flex flex-col justify-between group transition-all duration-500 hover:shadow-2xl
                      ${isBullish ? 'bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40' : 
                        isBearish ? 'bg-rose-950/20 border-rose-500/20 hover:border-rose-500/40' : 
                        'bg-blue-950/20 border-blue-500/20 hover:border-blue-500/40'}`}>
                      
                      {/* Background Glow */}
                      <div className={`absolute -top-20 -right-20 w-60 h-60 blur-[80px] rounded-full opacity-40 transition-all duration-1000 group-hover:opacity-60 group-hover:scale-110
                          ${isBullish ? 'bg-emerald-500' : isBearish ? 'bg-rose-500' : 'bg-blue-500'}`}></div>

                      <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-6">
                              <div className={`p-2 rounded-lg ${isBullish ? 'bg-emerald-500/10' : isBearish ? 'bg-rose-500/10' : 'bg-blue-500/10'}`}>
                                <Activity className={`w-5 h-5 ${isBullish ? 'text-emerald-400' : isBearish ? 'text-rose-400' : 'text-blue-400'}`} />
                              </div>
                              <span className="text-xs font-medium uppercase tracking-widest text-slate-400">Market Sentiment</span>
                          </div>
                          <h2 className={`text-4xl font-semibold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r 
                              ${isBullish ? 'from-emerald-400 to-teal-300' : isBearish ? 'from-rose-400 to-blue-300' : 'from-blue-400 to-indigo-300'}`}>
                              {parsedData.sentiment.label}
                          </h2>
                          <p className="text-slate-300 text-sm leading-relaxed font-medium opacity-90">
                              {parsedData.sentiment.reason}
                          </p>
                      </div>

                      {/* Mini Data Snapshot if available */}
                      {data && (
                          <div className="mt-8 pt-6 border-t border-white/5 relative z-10">
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

                  {/* Institutional Bias */}
                  {parsedData.institutional_bias && (
                      <motion.div variants={itemVariants} className="bg-slate-800/30 border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
                          <div className="flex items-center gap-3 mb-6 text-blue-400">
                              <div className="p-2 bg-blue-500/10 rounded-lg">
                                <ShieldAlert className="w-5 h-5" />
                              </div>
                              <span className="text-xs font-medium uppercase tracking-widest text-slate-400">Institutional Bias</span>
                          </div>
                          <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 mt-auto h-full flex items-center">
                              <p className="text-slate-300 text-sm leading-relaxed font-medium">{parsedData.institutional_bias}</p>
                          </div>
                      </motion.div>
                  )}

                  {/* Key Levels */}
                  {parsedData.key_levels && (
                      <motion.div variants={itemVariants} className="bg-slate-800/30 border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col group hover:border-white/10 transition-all duration-300">
                          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                              <div className="flex items-center gap-3 text-purple-400">
                                  <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <Scale className="w-5 h-5" />
                                  </div>
                                  <span className="text-xs font-medium uppercase tracking-widest text-slate-400">Key Levels</span>
                              </div>
                              {parsedData.key_levels.current_price && (
                                  <div className="flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/30 rounded-full">
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                      </span>
                                      <span className="text-[11px] font-mono font-medium text-blue-200">
                                          Spot: {parsedData.key_levels.current_price}
                                      </span>
                                  </div>
                              )}
                          </div>
                          
                          <div className="flex flex-col h-full justify-center gap-3 relative py-2 mt-auto">
                              <div className="absolute left-[1.375rem] top-4 bottom-4 w-0.5 bg-gradient-to-b from-purple-500/30 via-rose-500/30 via-yellow-500/30 to-emerald-500/30 border-l border-dashed border-white/10"></div>

                              {parsedData.key_levels.resistance_2 && (
                                  <div className="relative flex items-center gap-4 group/level">
                                      <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 z-10 group-hover/level:bg-purple-500/20 transition-all">
                                          <TrendingUp className="w-4 h-4 text-purple-400" />
                                      </div>
                                      <div className="flex-1 bg-slate-900/50 rounded-xl px-4 py-2 border border-white/5">
                                          <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Major Resistance</div>
                                          <div className="text-purple-300 font-mono font-medium text-sm">{parsedData.key_levels.resistance_2}</div>
                                      </div>
                                  </div>
                              )}
                              
                              <div className="relative flex items-center gap-4 group/level">
                                  <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0 z-10 group-hover/level:bg-rose-500/20 transition-all">
                                      <TrendingUp className="w-4 h-4 text-rose-400" />
                                  </div>
                                  <div className="flex-1 bg-slate-900/50 rounded-xl px-4 py-2 border border-white/5">
                                      <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Local Resistance</div>
                                      <div className="text-rose-300 font-mono font-medium text-sm">{parsedData.key_levels.resistance}</div>
                                  </div>
                              </div>
                              
                              <div className="relative flex items-center gap-4 group/level">
                                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 z-10 group-hover/level:bg-emerald-500/20 transition-all">
                                      <TrendingDown className="w-4 h-4 text-emerald-400" />
                                  </div>
                                  <div className="flex-1 bg-slate-900/50 rounded-xl px-4 py-2 border border-white/5">
                                      <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Local Support</div>
                                      <div className="text-emerald-300 font-mono font-medium text-sm">{parsedData.key_levels.support}</div>
                                  </div>
                              </div>

                              {parsedData.key_levels.support_2 && (
                                  <div className="relative flex items-center gap-4 group/level">
                                      <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shrink-0 z-10 group-hover/level:bg-teal-500/20 transition-all">
                                          <TrendingDown className="w-4 h-4 text-teal-400" />
                                      </div>
                                      <div className="flex-1 bg-slate-900/50 rounded-xl px-4 py-2 border border-white/5">
                                          <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Major Support</div>
                                          <div className="text-teal-300 font-mono font-medium text-sm">{parsedData.key_levels.support_2}</div>
                                      </div>
                                  </div>
                              )}
                          </div>
                      </motion.div>
                  )}
              </motion.div>

              {/* Playbook / Actionable Events */}
              {parsedData.playbook && parsedData.playbook.length > 0 && (
                  <motion.div variants={containerVariants} className="space-y-4">
                      <motion.div variants={itemVariants} className="flex items-center gap-3 px-2">
                          <Target className="w-5 h-5 text-blue-400" />
                          <h3 className="text-xl font-medium text-white font-heading tracking-tight">Trader's Playbook</h3>
                      </motion.div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {parsedData.playbook.map((event, idx) => {
                              return (
                                  <motion.div variants={itemVariants} key={idx} className="rounded-3xl border overflow-hidden relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-slate-900/40 border-white/5 hover:border-white/10">
                                      <div className="p-6">
                                          <div className="flex justify-between items-start mb-4">
                                              <div>
                                                  <div className="flex items-center gap-2 mb-2">
                                                      <span className="px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wider uppercase border bg-blue-500/20 text-blue-300 border-blue-500/30">
                                                          {event.date}
                                                      </span>
                                                  </div>
                                                  <div className="text-xl font-medium text-white tracking-tight leading-tight">{event.event}</div>
                                              </div>
                                          </div>

                                          <div className="grid grid-cols-2 gap-3 mb-4">
                                              <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
                                                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-medium">Forecast</div>
                                                  <div className="font-mono text-sm text-slate-200">{event.forecast}</div>
                                              </div>
                                              <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
                                                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-medium">Plan</div>
                                                  <div className="text-sm text-emerald-400 font-medium">{event.plan}</div>
                                              </div>
                                          </div>
                                          
                                          <div className="space-y-3 mt-4">
                                              <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
                                                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-medium">When to Act</div>
                                                  <div className="text-xs text-slate-300 font-medium">{event.when_to_act}</div>
                                              </div>
                                              <div className="bg-slate-950/50 rounded-xl p-3 border border-rose-500/10">
                                                  <div className="text-[10px] text-rose-500/80 uppercase tracking-wider mb-1 font-medium">Risk if Deviates</div>
                                                  <div className="text-xs text-rose-300 font-medium">{event.impact_if_deviates}</div>
                                              </div>
                                          </div>
                                      </div>
                                  </motion.div>
                              );
                          })}
                      </div>
                  </motion.div>
              )}

              {/* Global Context */}
              {parsedData.global_context && (
                  <motion.div variants={containerVariants} className="bg-slate-800/30 border border-white/5 rounded-3xl p-6 lg:p-8">
                      <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6 text-emerald-400">
                          <div className="p-2 bg-emerald-500/10 rounded-xl">
                            <Globe className="w-5 h-5" />
                          </div>
                          <h3 className="text-lg font-medium text-white font-heading tracking-tight">Global Context</h3>
                      </motion.div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <motion.div variants={itemVariants} className="space-y-3">
                              <div className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-2">News Highlights</div>
                              {parsedData.global_context.news_highlights.map((news, i) => (
                                  <div key={i} className="flex gap-3 text-sm text-slate-300 font-medium">
                                      <Minus className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                      <span className="leading-relaxed">{news}</span>
                                  </div>
                              ))}
                          </motion.div>
                          
                          <motion.div variants={itemVariants} className="bg-slate-900/50 p-5 rounded-2xl border border-white/5">
                              <div className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-3">Weekly Impact</div>
                              <p className="text-sm text-slate-300 font-medium leading-relaxed">{parsedData.global_context.weekly_impact}</p>
                          </motion.div>
                      </div>
                  </motion.div>
              )}
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
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -mr-20 -mt-20 animate-pulse duration-[4s]"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -ml-16 -mb-16"></div>
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
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-white/5 text-xs font-medium text-slate-300 transition-all hover:border-white/10 active:scale-95"
                >
                    <Languages className="w-3.5 h-3.5 text-blue-400" />
                    <span>{currentLang}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLangMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-40 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/50">
                        {['English', 'Arabic', 'French'].map((lang) => (
                            <button
                                key={lang}
                                onClick={() => handleLanguageChange(lang)}
                                className={`w-full text-left px-4 py-3 text-xs font-medium hover:bg-white/5 transition-colors flex items-center justify-between
                                    ${currentLang === lang ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400'}
                                `}
                            >
                                {lang}
                                {currentLang === lang && <Check className="w-3.5 h-3.5" />}
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
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 relative z-10">
            {(isLoading || isTranslating) ? (
                <div className="flex flex-col items-center justify-center py-32 gap-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
                        <div className="relative z-10 p-6 bg-slate-900/50 rounded-full border border-white/10 shadow-2xl backdrop-blur-md">
                             <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
                        </div>
                    </div>
                    <div className="text-center space-y-4 max-w-sm mx-auto">
                        <h4 className="text-white font-medium text-2xl animate-pulse tracking-tight">
                            {isTranslating ? `Translating to ${currentLang}...` : "Synthesizing Market Data..."}
                        </h4>
                        <div className="flex flex-col gap-2 items-center">
                             <div className="h-1.5 w-48 bg-slate-800 rounded-full overflow-hidden">
                                 <div className="h-full bg-gradient-to-r from-blue-500 to-white animate-progress w-full origin-left"></div>
                             </div>
                             <p className="text-slate-500 text-sm font-mono mt-2">
                                 Analyzing institutional flows & news...
                             </p>
                        </div>
                    </div>
                </div>
            ) : (
                renderContent()
            )}
        </div>

        {/* Footer Actions */}
        {!isLoading && !isTranslating && parsedData && (
            <div className="p-6 border-t border-white/5 bg-slate-900/80 backdrop-blur-xl flex justify-between items-center z-10 shrink-0 relative">
                <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2">
                    <Info className="w-3.5 h-3.5" />
                    AI analysis may vary. Always verify with your own research.
                </div>
                <div className="flex gap-4 w-full sm:w-auto justify-end">
                    <button 
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-all border border-white/5 hover:border-white/10 active:scale-95"
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
