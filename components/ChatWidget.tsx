import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Brain, User, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
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

const ChatWidget: React.FC<ChatWidgetProps> = ({ themeMode, summaryData, historyData, historyDates }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'مرحباً بك! أنا كبير الخبراء الاقتصاديين والمرشد التعليمي لـ EG-Finance Fx. أنا هنا للإجابة عن أي سؤال حول تقرير COT وكيفية الاستفادة منه، بالإضافة لتحليل الأخبار الاقتصادية وتأثيرها على الأصول (هيزيد / هيقل / محايد). تحب نسأل عن إيه اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

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

  const initChat = () => {
    if (!chatSessionRef.current) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Prepare context Data
      let contextDataStr = "بيانات تقرير COT الحالية والتاريخية:\n\n";
      summaryData.forEach(row => {
          const assetName = row.Commodity;
          contextDataStr += `${assetName}:\n`;
          contextDataStr += `  الأسبوع الحالي: صافي المراكز: ${row['Net Positions']} (تغير: ${row['Net Change']}), شراء: ${row['Long Positions']} (تغير: ${row['Long Change']}), بيع: ${row['Short Positions']} (تغير: ${row['Short Change']})\n`;
          
          const historyRecord = historyData.find(h => h.Commodity === assetName);
          if (historyRecord) {
              contextDataStr += `  صافي المراكز في الأسابيع السابقة:\n`;
              historyDates.forEach(date => {
                  if (historyRecord[date] !== undefined) {
                      contextDataStr += `    - ${date}: ${historyRecord[date]}\n`;
                  }
              });
          }
          contextDataStr += "\n";
      });
      
      const today = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      chatSessionRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: `أنت كبير الخبراء الاقتصاديين والمرشد التعليمي المتخصص حصرياً في "التحليل الأساسي" (Fundamental Analysis) وبيانات "تقرير التزام المتاجرين" (COT - Commitments of Traders) لدى EG-Finance Fx. 
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
${contextDataStr}`
        }
      });
    }
  };

  const handleSend = async (textToSend?: string) => {
    const userMsg = typeof textToSend === 'string' ? textToSend.trim() : input.trim();
    if (!userMsg) return;
    
    if (typeof textToSend !== 'string') {
      setInput('');
    }
    
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      initChat();
      const responseStream = await chatSessionRef.current.sendMessageStream({ message: userMsg });
      
      let fullText = '';
      let isFirstChunk = true;

      for await (const chunk of responseStream) {
        if (isFirstChunk) {
          setIsLoading(false);
          isFirstChunk = false;
          setMessages(prev => [...prev, { role: 'model', text: chunk.text || '' }]);
          fullText = chunk.text || '';
        } else {
          fullText += chunk.text || '';
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'model', text: fullText };
            return updated;
          });
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'عذراً، حدث خطأ أثناء معالجة طلبك.' }]);
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

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleOpenChat}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl transition-all hover:scale-110 z-40 flex items-center justify-center overflow-hidden group ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Animated Border Gradient */}
        <div className="absolute inset-[-100%] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#0ea5e9_50%,#0000_100%)] animate-[spin_4s_linear_infinite]" />
        
        {/* Inner Background */}
        <div className={`absolute inset-[2px] rounded-full z-0 transition-colors ${
          isLight 
            ? 'bg-blue-600 group-hover:bg-blue-700' 
            : 'bg-slate-900 group-hover:bg-slate-800'
        }`}></div>

        <MessageCircle className={`relative z-10 w-6 h-6 ${isLight ? 'text-white' : 'text-cyan-400'} group-hover:animate-bounce`} />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 z-50 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        } ${
          isLight 
            ? 'bg-white border border-slate-200' 
            : 'bg-slate-900 border border-slate-700'
        }`}
      >
        {/* Header */}
        <div className={`p-4 flex items-center justify-between border-b ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/50 text-cyan-400'}`}>
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>EG-Finance Fx</h3>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className={`p-1.5 rounded-md transition-colors ${
              isLight ? 'text-slate-400 hover:bg-slate-200 hover:text-slate-700' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div 
          ref={chatContainerRef}
          className={`flex-1 overflow-y-auto p-4 flex flex-col gap-4 scroll-smooth ${
            isLight ? 'bg-white' : 'bg-slate-900'
          }`}
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' 
                  ? (isLight ? 'bg-blue-600 text-white' : 'bg-cyan-600 text-white')
                  : (isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-cyan-400')
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
              </div>
              <div className={`p-3 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? (isLight ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-cyan-600 text-white rounded-tr-sm')
                  : (isLight ? 'bg-slate-100 text-slate-800 rounded-tl-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm')
              }`} dir="auto">
                <div className="markdown-body prose prose-sm max-w-none dark:prose-invert [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:mb-2 [&>h1]:font-bold [&>h1]:text-lg [&>h2]:font-bold [&>h2]:text-base [&>h3]:font-bold [&>strong]:font-bold">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {messages.length === 1 && (
            <div className="flex flex-col gap-2 mt-2 items-end w-full pl-12">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className={`text-right px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm transition-all border ${
                    isLight 
                      ? 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50' 
                      : 'bg-slate-800/50 border-cyan-800/50 text-cyan-400 hover:bg-cyan-900/30'
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
                isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-cyan-400'
              }`}>
                <Brain className="w-4 h-4" />
              </div>
              <div className={`p-3 rounded-2xl text-sm flex items-center gap-2 ${
                isLight ? 'bg-slate-100 text-slate-800 rounded-tl-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm'
              }`}>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="opacity-70">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`p-3 border-t ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about COT data or markets..."
              className={`w-full pl-4 pr-12 py-3 rounded-xl resize-none focus:outline-none focus:ring-2 transition-all ${
                isLight 
                  ? 'bg-slate-100 text-slate-900 placeholder-slate-500 focus:ring-blue-500/50' 
                  : 'bg-slate-900 text-white placeholder-slate-500 focus:ring-cyan-500/50 border border-slate-700'
              }`}
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`absolute right-2 bottom-2 p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                isLight 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-cyan-600 text-white hover:bg-cyan-500'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatWidget;
