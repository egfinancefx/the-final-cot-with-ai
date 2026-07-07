import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Brain, User, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { ThemeMode } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatWidgetProps {
  themeMode: ThemeMode;
}

const SUGGESTED_PROMPTS = [
  "اشرح لي كيف أقرأ بيانات COT كمتداول مبتدئ؟",
  "ماذا يعني عندما تزيد صفقات الشراء (Long) بشكل كبير؟",
  "كيف أكتشف انعكاس الاتجاه (Reversal) من هذه البيانات؟",
  "ما هو الفرق بين Open Interest و Net Position؟"
];

const ChatWidget: React.FC<ChatWidgetProps> = ({ themeMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'مرحباً! أنا مساعدك الذكي للتداول. كيف يمكنني مساعدتك في تحليل الأسواق اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      // Using scrollTop instead of scrollIntoView to prevent layout thrashing/freezing
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Small delay to ensure DOM has updated before scrolling
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
      
      // Techy Arpeggio/Chime: C5 -> E5 -> G5 -> C6
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.05);
      osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1);
      osc1.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.15);

      osc2.frequency.setValueAtTime(261.63, ctx.currentTime); // C4 for depth
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
      chatSessionRef.current = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: 'You are an expert financial analyst and trading mentor for EG-Finance Fx. You help users understand COT (Commitments of Traders) data, market trends, and trading strategies. Be concise, professional, and insightful. IMPORTANT: When responding in Arabic, provide clean, well-organized text. Avoid using raw markdown symbols like ** or #. Use clear paragraph breaks, bullet points (using standard dashes), and a polite, professional tone.'
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
      const response = await chatSessionRef.current.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
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
