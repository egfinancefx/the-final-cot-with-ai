import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, X, Send, Brain, User, Loader2, 
  Mic, MicOff, Sliders, Volume2, Sparkles, Check, AlertCircle 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ThemeMode, SummaryRow, HistoryRow } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatWidgetProps {
  themeMode: ThemeMode;
  summaryData: SummaryRow[];
  historyData: HistoryRow[];
  historyDates: string[];
}

const SUGGESTED_PROMPTS = [
  "يعني إيه تقرير COT وإزاي أستفيد منه كطالب أو متداول مبتدئ؟",
  "ما هو الفرق بين صفقات الشراء (Long) والبيع (Short) وصافي المراكز؟",
  "النهارده إيه؟ وما هي الأخبار اللي ممكن تأثر على السوق هذا الأسبوع؟",
  "ما هو تأثير الأخبار على الذهب؟ هل هيزيد ولا هيقل ولا محايد؟"
];

// Audio conversion helpers for Real-Time Gemini Live API WebSocket
const base64ToFloat32Array = (base64: string): Float32Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const buffer = bytes.buffer;
  const int16Array = new Int16Array(buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
};

const float32ArrayToBase64 = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const bytes = new Uint8Array(int16Array.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const ChatWidget: React.FC<ChatWidgetProps> = ({ themeMode, summaryData, historyData, historyDates }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'مرحباً بك! أنا المساعد المالي والتعليمي الشامل لـ EG-Finance Fx. يمكنك التحدث معي صوتياً مباشرة بالضغط على زر المايكروفون، أو كتابة أي سؤال عن تقرير COT والتحليل الأساسي وتوقعات الأسواق (هيزيد / هيقل / محايد). كيف أساعدك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // ================= Voice Assistant State & Refs =================
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isVoiceConnecting, setIsVoiceConnecting] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  // Customization state
  const [showSettings, setShowSettings] = useState(false);
  const [userName, setUserName] = useState(localStorage.getItem('ai_user_name') || 'المتداول');
  const [botPersona, setBotPersona] = useState(localStorage.getItem('ai_bot_persona') || 'مباشر وسريع جداً، ادخل في صلب الموضوع');

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Save settings when changed
  useEffect(() => {
    localStorage.setItem('ai_user_name', userName);
    localStorage.setItem('ai_bot_persona', botPersona);
  }, [userName, botPersona]);

  // Clean up voice connection on unmount
  useEffect(() => {
    return () => {
      stopVoiceChat();
    };
  }, []);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [messages, isOpen]);

  const playPopSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.type = 'sine';
      osc2.type = 'triangle';
      
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.05);
      osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1);
      osc1.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.15);

      osc2.frequency.setValueAtTime(261.63, ctx.currentTime);
      osc2.frequency.setValueAtTime(329.63, ctx.currentTime + 0.05);
      osc2.frequency.setValueAtTime(392.00, ctx.currentTime + 0.1);
      osc2.frequency.setValueAtTime(523.25, ctx.currentTime + 0.15);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const handleOpenChat = () => {
    if (!isOpen) {
      playPopSound();
      setIsOpen(true);
    }
  };

  // ================= Voice Assistant Methods =================
  const startVoiceChat = async () => {
    try {
      setIsVoiceConnecting(true);
      setVoiceError(null);

      // 1. Get microphone access immediately to ensure user gesture context
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
      } });
      streamRef.current = stream;

      // 2. Connect WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        let contextDataStr = "الأصول والبيانات الحالية والتاريخية:\n\n";

        const formatChange = (val: number) => {
            if (val > 0) return `زيادة بمقدار ${val}`;
            if (val < 0) return `انخفاض بمقدار ${Math.abs(val)}`;
            return `بدون تغير (0)`;
        };

        summaryData.forEach(row => {
            const assetName = row.Commodity;
            let assetHistoryStr = `${assetName}:\n`;
            assetHistoryStr += `  الأسبوع الحالي:\n`;
            assetHistoryStr += `    - صافي المراكز (Net): ${row['Net Positions']} (التغير: ${formatChange(row['Net Change'])})\n`;
            assetHistoryStr += `    - عقود الشراء (Longs): ${row['Long Positions']} (التغير: ${formatChange(row['Long Change'])})\n`;
            assetHistoryStr += `    - عقود البيع (Shorts): ${row['Short Positions']} (التغير: ${formatChange(row['Short Change'])})\n`;
            
            const historyRecord = historyData.find(h => h.Commodity === assetName);
            if (historyRecord) {
                assetHistoryStr += `  الأسابيع الستة السابقة لصافي المراكز (Net Positions):\n`;
                historyDates.slice(0, 6).forEach(date => {
                    const val = historyRecord[date];
                    if (val !== undefined) {
                        assetHistoryStr += `    - ${date}: ${val}\n`;
                    }
                });
            }
            
            contextDataStr += assetHistoryStr + "\n";
        });
        
        ws.send(JSON.stringify({ 
            type: 'setup', 
            data: contextDataStr,
            userName,
            botPersona
        }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        
        if (msg.error) {
            console.error("Server WebSocket Error:", msg.error);
            setVoiceError(msg.error);
            stopVoiceChat();
            return;
        }

        if (msg.ready) {
          setIsVoiceConnecting(false);
          setIsVoiceActive(true);

          // Initialize Audio Contexts
          const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          inputAudioCtxRef.current = inputCtx;
          
          const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          outputAudioCtxRef.current = outputCtx;
          nextStartTimeRef.current = outputCtx.currentTime;

          const source = inputCtx.createMediaStreamSource(stream);
          sourceRef.current = source;

          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          source.connect(processor);
          processor.connect(inputCtx.destination);

          processor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
              const inputData = e.inputBuffer.getChannelData(0);
              const base64 = float32ArrayToBase64(inputData);
              ws.send(JSON.stringify({ audio: base64 }));
            }
          };
        } else if (msg.interrupted) {
            nextStartTimeRef.current = outputAudioCtxRef.current?.currentTime || 0;
            return;
        }
        if (msg.audio && outputAudioCtxRef.current) {
          const float32Data = base64ToFloat32Array(msg.audio);
          const buffer = outputAudioCtxRef.current.createBuffer(1, float32Data.length, 24000);
          buffer.getChannelData(0).set(float32Data);

          const source = outputAudioCtxRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(outputAudioCtxRef.current.destination);

          const currentTime = outputAudioCtxRef.current.currentTime;
          if (nextStartTimeRef.current < currentTime) {
              nextStartTimeRef.current = currentTime;
          }
          source.start(nextStartTimeRef.current);
          nextStartTimeRef.current += buffer.duration;
        }
      };

      ws.onclose = () => {
        stopVoiceChat();
      };

    } catch (err: any) {
      setVoiceError(err.message || 'فشل الاتصال بالمايكروفون');
      setIsVoiceConnecting(false);
    }
  };

  const stopVoiceChat = () => {
    setIsVoiceActive(false);
    setIsVoiceConnecting(false);
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      if (inputAudioCtxRef.current.state !== 'closed') {
        inputAudioCtxRef.current.close().catch(() => {});
      }
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      if (outputAudioCtxRef.current.state !== 'closed') {
        outputAudioCtxRef.current.close().catch(() => {});
      }
      outputAudioCtxRef.current = null;
    }
  };

  const toggleVoiceCall = () => {
    if (isVoiceActive || isVoiceConnecting) {
      stopVoiceChat();
    } else {
      startVoiceChat();
    }
  };

  // ================= Text Chat System Instruction =================
  const getSystemInstruction = () => {
    let contextDataStr = "بيانات تقرير COT الحالية والتاريخية:\n\n";
    summaryData.forEach(row => {
        const assetName = row.Commodity;
        contextDataStr += `${assetName}:\n`;
        contextDataStr += `  الأسبوع الحالي: صافي المراكز: ${row['Net Positions']} (تغير: ${row['Net Change']}), شراء: ${row['Long Positions']} (تغير: ${row['Long Change']}), بيع: ${row['Short Positions']} (تغير: ${row['Short Change']})\n`;
        
        const historyRecord = historyData.find(h => h.Commodity === assetName);
        if (historyRecord) {
            contextDataStr += `  صافي المراكز في آخر 6 أسابيع:\n`;
            historyDates.slice(0, 6).forEach(date => {
                if (historyRecord[date] !== undefined) {
                    contextDataStr += `    - ${date}: ${historyRecord[date]}\n`;
                }
            });
        }
        contextDataStr += "\n";
    });
    
    const today = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return `أنت كبير الخبراء الاقتصاديين والمرشد التعليمي المتخصص حصرياً في "التحليل الأساسي" (Fundamental Analysis) وبيانات "تقرير التزام المتاجرين" (COT - Commitments of Traders) لدى EG-Finance Fx. اسمك المساعد المالي واسم المستخدم هو "${userName}".
أسلوبك المفضل: "${botPersona}".
تاريخ اليوم هو: ${today}.

أنت ملم تماماً بالتحليل الأساسي والأخبار الاقتصادية، وتجمع بين كونك محللاً استراتيجياً ومعلماً مالياً يشرح ويبسط للطلاب والمتداولين المبتدئين كل ما يتعلق بتقارير COT.

دليلك الشامل لتقرير COT للإجابة والتعليم:
1. ما هو تقرير COT؟: تقرير تصدره هيئة تنظيم السلع الآجلة الأمريكية (CFTC) أسبوعياً كل يوم جمعة، يعكس تمركزات كبار المؤسسات الاستثمارية وصناديق التحوط والبنوك (Smart Money) مقارنة بالتجاريين في أسواق العقود الآجلة.
2. صفقات الشراء (Longs) وصفقات البيع (Shorts): عقود الشراء تراهن على ارتفاع السعر، وعقود البيع تراهن على انخفاض السعر.
3. صافي المراكز (Net Positions): هو ناتج طرح عقود البيع من عقود الشراء (Longs - Shorts). إذا كان الناتج إيجابياً يعني سيطرة النزعة الشرائية، وإذا كان سلبياً يعني سيطرة النزعة البيعية.
4. التغير الحالي لهذا الأسبوع (Weekly Change): يبين التغير الصافي لصفقات الشراء والبيع؛ الزيادة الكبيرة في صفقات الشراء تدل على تدفق سيولة وتراكم شرائي (Accumulation)، وانخفاضها مع زيادة البيع يدل على تصريف (Distribution).
5. كيف يستفيد الطالب والمتداول لبناء نتائجه؟: يفهم المتداول اتجاه السيولة المؤسسية الحقيقية ويتداول مع اتجاه الأموال الذكية بدلاً من السير عكسها، مع دمج ذلك بالأخبار الاقتصادية، وعند بلوغ المراكز قيماً قياسية تاريخية غير مسبوقة يتم الحذر من احتمال حدوث انعكاس.

قواعد صارمة جداً لعملك:
1. تخصص مطلق في التحليل الأساسي وتقارير COT: ممنوع منعاً باتاً ذكر أي أدوات تحليل فني (دعوم ومقاومات، مؤشرات فنية كـ RSI و Moving Averages، أو نماذج شموع). التحليل الفني خط أحمر.
2. الجانب التعليمي والمبسط: إذا سألك طالب أو مبتدئ أي سؤال تعليمي حول التقرير أو مصطلحاته، اشرح له ببساطة ووضوح وبأمثلة من الواقع.
3. الحكم المباشر والواضح (هيزيد / هيقل / محايد): لكل أصل مالي يُسأل عنه، حدد التأثير في بداية إجابتك:
   - [هيزيد / صعود 📈]
   - أو [هيقل / هبوط 📉]
   - أو [محايد / تذبذب ⚖️]
   مع شرح السبب الاقتصادي الأساسي وتأكيد ذلك بأرقام الشراء والبيع وتغيرات الأسبوع في تقرير COT.
4. الوعي بتاريخ اليوم وأجندة الأسبوع: عند سؤالك "النهارده إيه؟" أو عن أحداث الأسبوع، اذكر اليوم وتاريخه كاملاً وأهم الأخبار الاقتصادية المؤثرة لهذا الأسبوع.
5. لغة الخطاب: تحدث باللغة العربية بأسلوب راقٍ واحترافي وتعليمي مشجع، سريع ومباشر.

السياق المالي الحالي (البيانات):
${contextDataStr}`;
  };

  const handleSend = async (textToSend?: string) => {
    const userMsg = typeof textToSend === 'string' ? textToSend.trim() : input.trim();
    if (!userMsg) return;
    
    if (typeof textToSend !== 'string') {
      setInput('');
    }
    
    const nextMessages = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: messages,
          systemInstruction: getSystemInstruction(),
          model: 'gemini-3.1-flash-lite'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate response');
      }
      setMessages([...nextMessages, { role: 'model', text: data.text || 'لم يتم استلام رد.' }]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const isQuota = error.message?.includes('quota') || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
      const errTxt = isQuota
        ? 'عذراً، تم تجاوز حد استهلاك خدمة الذكاء الاصطناعي (Quota Exceeded) مؤقتاً. يرجى الانتظار دقيقة والمحاولة مجدداً.'
        : ('عذراً، حدث خطأ أثناء معالجة طلبك: ' + (error.message || 'يرجى المحاولة لاحقاً'));
      setMessages([...nextMessages, { role: 'model', text: errTxt }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isLight = themeMode === 'light';
  const isColorful = themeMode === 'colorful';

  return (
    <>
      {/* Single Unified Floating Button for Voice & Writing Chat */}
      <button
        onClick={handleOpenChat}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl transition-all hover:scale-105 z-40 flex items-center justify-center overflow-visible group ${
          isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}
        title="المساعد الذكي لـ EG-Finance Fx (محادثة صوتية وكتابية)"
      >
        {/* Animated Border Gradient */}
        <div className="absolute inset-[-2px] rounded-full overflow-hidden">
          <div className={`absolute inset-[-100%] animate-[spin_4s_linear_infinite] ${
            isVoiceActive 
              ? 'bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#10b981_50%,#0000_100%)]' 
              : isColorful 
                ? 'bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#d946ef_50%,#0000_100%)]' 
                : 'bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#0ea5e9_50%,#0000_100%)]'
          }`} />
        </div>
        
        {/* Inner Background */}
        <div className={`absolute inset-[2px] rounded-full z-0 transition-colors ${
          isVoiceActive
            ? 'bg-emerald-600 animate-pulse'
            : isLight 
              ? 'bg-blue-600 group-hover:bg-blue-700' 
              : isColorful
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 group-hover:brightness-110 shadow-[0_0_15px_rgba(217,70,239,0.5)]'
                : 'bg-slate-900 group-hover:bg-slate-800'
        }`}></div>

        {/* Center Icon */}
        <div className="relative z-10 flex items-center justify-center text-white">
          {isVoiceActive ? (
            <Mic className="w-6 h-6 animate-pulse" />
          ) : (
            <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          )}
        </div>

        {/* Dual Mode Indicator Badge: Mic Badge at top-right corner */}
        {!isVoiceActive && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              handleOpenChat();
              startVoiceChat();
            }}
            className={`absolute -top-1 -right-1 z-20 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-md border cursor-pointer hover:scale-125 transition-transform ${
              isLight
                ? 'bg-emerald-500 hover:bg-emerald-600 border-white'
                : isColorful
                  ? 'bg-fuchsia-500 hover:bg-fuchsia-600 border-[#12102b]'
                  : 'bg-emerald-500 hover:bg-emerald-600 border-slate-900'
            }`}
            title="بدء محادثة صوتية فورية مباشرة"
          >
            <Mic className="w-3 h-3" />
          </div>
        )}
      </button>

      {/* Unified Assistant Window */}
      <div
        className={`fixed bottom-6 right-6 w-[360px] sm:w-[420px] h-[540px] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 z-50 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        } ${
          isLight 
            ? 'bg-white border border-slate-200' 
            : isColorful
              ? 'bg-[#14122e] border border-purple-500/30 shadow-[0_0_40px_rgba(139,92,246,0.3)]'
              : 'bg-slate-900 border border-slate-700'
        }`}
      >
        {/* Header with Title + Voice Call Toggle + Settings + Close */}
        <div className={`px-4 py-3 flex items-center justify-between border-b ${
          isLight 
            ? 'bg-slate-50 border-slate-200' 
            : isColorful
              ? 'bg-[#1a163b] border-purple-500/25'
              : 'bg-slate-800 border-slate-700'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-1.5 rounded-lg shrink-0 ${
              isVoiceActive
                ? 'bg-emerald-500 text-white animate-pulse'
                : isLight 
                  ? 'bg-blue-100 text-blue-600' 
                  : isColorful
                    ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-sm'
                    : 'bg-blue-900/50 text-white'
            }`}>
              {isVoiceActive ? <Mic className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h3 className={`font-semibold text-xs sm:text-sm truncate ${isLight ? 'text-slate-900' : isColorful ? 'text-purple-50' : 'text-white'}`}>
                EG-Finance Fx Assistant
              </h3>
              <p className="text-[10px] text-slate-400 truncate">
                {isVoiceActive ? 'محادثة صوتية نشطة...' : 'صوتي وكتابي (COT & Macro)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live Voice Call Toggle Button */}
            <button
              onClick={toggleVoiceCall}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                isVoiceActive
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md animate-pulse'
                  : isVoiceConnecting
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : isLight
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : isColorful
                        ? 'bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 hover:from-violet-600/50 hover:to-fuchsia-600/50 text-purple-200 border border-purple-500/40'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
              }`}
              title={isVoiceActive ? 'إنهاء المكالمة الصوتية' : 'بدء محادثة صوتية فورية'}
            >
              {isVoiceConnecting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-[11px] hidden sm:inline">جاري الاتصال</span>
                </>
              ) : isVoiceActive ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span className="text-[11px]">إنهاء</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span className="text-[11px]">محادثة صوتية</span>
                </>
              )}
            </button>

            {/* Voice Persona Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg transition-colors ${
                showSettings
                  ? (isLight ? 'bg-slate-200 text-slate-800' : 'bg-slate-700 text-white')
                  : (isLight ? 'text-slate-400 hover:bg-slate-200 hover:text-slate-700' : 'text-slate-400 hover:bg-slate-700 hover:text-white')
              }`}
              title="إعدادات الصوت والشخصية"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {/* Minimize / Close */}
            <button 
              onClick={() => setIsOpen(false)}
              className={`p-1.5 rounded-lg transition-colors ${
                isLight ? 'text-slate-400 hover:bg-slate-200 hover:text-slate-700' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Audio Call Banner when active */}
        {isVoiceActive && (
          <div className={`px-3 py-2 flex items-center justify-between border-b text-xs shrink-0 animate-fade-in ${
            isLight ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/20'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-0.5 shrink-0">
                <span className="w-1 h-3.5 bg-emerald-500 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
                <span className="w-1 h-5 bg-emerald-500 rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.1s]" />
                <span className="w-1 h-2.5 bg-emerald-500 rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.2s]" />
                <span className="w-1 h-4 bg-emerald-500 rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.3s]" />
              </div>
              <span className="text-[11px] truncate">مكالمة صوتية حية نشطة.. تحدث بحرية عبر المايكروفون</span>
            </div>
            <button 
              onClick={stopVoiceChat}
              className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 transition-colors shrink-0"
            >
              قطع الصوت
            </button>
          </div>
        )}

        {/* Voice Error Notice if any */}
        {voiceError && (
          <div className="p-2.5 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{voiceError}</span>
            </div>
            <button onClick={() => setVoiceError(null)} className="text-[10px] underline ml-2 shrink-0">إغلاق</button>
          </div>
        )}

        {/* AI Settings Overlay Card */}
        {showSettings && (
          <div className={`p-4 border-b flex flex-col gap-3 shrink-0 animate-fade-in ${
            isLight ? 'bg-slate-50 border-slate-200' : isColorful ? 'bg-[#181438] border-purple-500/30' : 'bg-slate-800/90 border-slate-700'
          }`}>
            <div className="flex items-center justify-between">
              <h4 className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                إعدادات الصوت والشخصية للمساعد
              </h4>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white text-xs">
                تم ✓
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>اسمك (كيف يناديك؟):</label>
              <input 
                type="text" 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="المتداول"
                className={`px-3 py-1.5 text-xs rounded-lg border outline-none ${
                  isLight 
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-blue-400' 
                    : isColorful
                      ? 'bg-[#121028] border-purple-500/30 text-purple-100 focus:border-purple-400'
                      : 'bg-slate-900 border-slate-700 text-white focus:border-white'
                }`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>أسلوب وشخصية الردود:</label>
              <textarea 
                value={botPersona}
                onChange={(e) => setBotPersona(e.target.value)}
                placeholder="مباشر وسريع جداً، ادخل في صلب الموضوع"
                rows={2}
                className={`px-3 py-1.5 text-xs rounded-lg border outline-none resize-none ${
                  isLight 
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-blue-400' 
                    : isColorful
                      ? 'bg-[#121028] border-purple-500/30 text-purple-100 focus:border-purple-400'
                      : 'bg-slate-900 border-slate-700 text-white focus:border-white'
                }`}
              />
            </div>
          </div>
        )}

        {/* Messages Feed Area */}
        <div 
          ref={chatContainerRef}
          className={`flex-1 overflow-y-auto p-4 flex flex-col gap-4 scroll-smooth ${
            isLight ? 'bg-white' : isColorful ? 'bg-[#100e26]' : 'bg-slate-900'
          }`}
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' 
                  ? (isLight ? 'bg-blue-600 text-white' : isColorful ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm' : 'bg-blue-500 text-white')
                  : (isLight ? 'bg-slate-200 text-slate-600' : isColorful ? 'bg-purple-900/60 text-purple-200 border border-purple-500/30' : 'bg-slate-800 text-white')
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
              </div>
              <div className={`p-3 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? (isLight ? 'bg-blue-600 text-white rounded-tr-sm' : isColorful ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-tr-sm shadow-md' : 'bg-blue-500 text-white rounded-tr-sm')
                  : (isLight ? 'bg-slate-100 text-slate-800 rounded-tl-sm' : isColorful ? 'bg-[#1c1844] text-purple-100 rounded-tl-sm border border-purple-500/20' : 'bg-slate-800 text-slate-200 rounded-tl-sm')
              }`} dir="auto">
                <div className="markdown-body prose prose-sm max-w-none dark:prose-invert [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:mb-2 [&>h1]:font-medium [&>h1]:text-lg [&>h2]:font-medium [&>h2]:text-base [&>h3]:font-medium [&>strong]:font-medium">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {messages.length === 1 && (
            <div className="flex flex-col gap-2 mt-2 items-end w-full pl-8">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className={`text-right px-3.5 py-2 rounded-2xl rounded-tr-sm text-xs transition-all border ${
                    isLight 
                      ? 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50 shadow-xs' 
                      : isColorful
                        ? 'bg-[#1c1744] border-purple-500/40 text-purple-200 hover:bg-[#251f5c]'
                        : 'bg-slate-800/50 border-blue-800/50 text-white hover:bg-blue-900/30'
                  }`}
                  dir="rtl"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isLight ? 'bg-slate-200 text-slate-600' : isColorful ? 'bg-purple-900/60 text-purple-200 border border-purple-500/30' : 'bg-slate-800 text-white'
              }`}>
                <Brain className="w-4 h-4" />
              </div>
              <div className={`p-3 rounded-2xl text-sm flex items-center gap-2 ${
                isLight ? 'bg-slate-100 text-slate-800 rounded-tl-sm' : isColorful ? 'bg-[#1c1844] text-purple-100 rounded-tl-sm border border-purple-500/20' : 'bg-slate-800 text-slate-200 rounded-tl-sm'
              }`}>
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="opacity-70 text-xs">جاري التفكير وصياغة الرد...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area: Textarea + Quick Mic + Send */}
        <div className={`p-3 border-t ${
          isLight 
            ? 'bg-white border-slate-200' 
            : isColorful
              ? 'bg-[#181438] border-purple-500/25'
              : 'bg-slate-800 border-slate-700'
        }`}>
          <div className="relative flex items-center gap-1.5">
            {/* Quick Mic toggle inside the input bar */}
            <button
              onClick={toggleVoiceCall}
              className={`p-2.5 rounded-xl border transition-all shrink-0 ${
                isVoiceActive
                  ? 'bg-rose-500 text-white border-rose-600 shadow-md animate-pulse'
                  : isVoiceConnecting
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' 
                      : isColorful
                        ? 'bg-[#1e1944] hover:bg-[#28215c] border-purple-500/30 text-purple-300'
                        : 'bg-slate-900 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title={isVoiceActive ? 'إنهاء المكالمة الصوتية' : 'تحدث عبر المايكروفون (Live Voice)'}
            >
              {isVoiceActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <div className="relative flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب سؤالك هنا أو تحدث بالمايك..."
                className={`w-full pl-3 pr-10 py-2.5 rounded-xl text-xs sm:text-sm resize-none focus:outline-none focus:ring-2 transition-all ${
                  isLight 
                    ? 'bg-slate-100 text-slate-900 placeholder-slate-500 focus:ring-blue-500/50' 
                    : isColorful
                      ? 'bg-[#121028] text-purple-100 placeholder-purple-300/40 focus:ring-purple-500/50 border border-purple-500/30'
                      : 'bg-slate-900 text-white placeholder-slate-500 focus:ring-white/50 border border-slate-700'
                }`}
                rows={1}
                style={{ minHeight: '42px', maxHeight: '100px' }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors disabled:opacity-30 ${
                  isLight 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : isColorful
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:brightness-110 shadow-sm'
                      : 'bg-blue-500 text-white hover:bg-blue-400'
                }`}
                title="إرسال"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatWidget;
