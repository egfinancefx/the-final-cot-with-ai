import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { ThemeMode, SummaryRow, HistoryRow } from '../types';

interface VoiceChatWidgetProps {
  themeMode: ThemeMode;
  summaryData: SummaryRow[];
  historyData: HistoryRow[];
  historyDates: string[];
}

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

export default function VoiceChatWidget({ themeMode, summaryData, historyData, historyDates }: VoiceChatWidgetProps) {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  const startVoiceChat = async () => {
    try {
      setIsConnecting(true);
      setError(null);

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
        // Prepare detailed historical context data
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
            
            // Find history for this asset
            const historyRecord = historyData.find(h => h.Commodity === assetName);
            
            if (historyRecord) {
                assetHistoryStr += `  الأسابيع السابقة لصافي المراكز (Net Positions):\n`;
                historyDates.forEach(date => {
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
            setError(msg.error);
            stopVoiceChat();
            return;
        }

        if (msg.ready) {
          setIsConnecting(false);
          setIsActive(true);

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
      setError(err.message);
      setIsConnecting(false);
    }
  };

  const stopVoiceChat = () => {
    setIsActive(false);
    setIsConnecting(false);
    
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
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }
  };

  const toggleCall = () => {
    if (isActive || isConnecting) {
      stopVoiceChat();
    } else {
      startVoiceChat();
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-3">
        {error && (
            <div className={`px-3 py-2 rounded-lg shadow-lg text-xs font-medium max-w-xs ${themeMode === 'light' ? 'bg-rose-100 text-rose-600' : 'bg-rose-500/20 text-rose-400'}`}>
                {error}
            </div>
        )}
        
        {showSettings && !isActive && !isConnecting && (
            <div className={`w-64 p-4 rounded-2xl shadow-2xl border flex flex-col gap-3 ${themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-blue-500/30'}`}>
                <h4 className={`text-sm font-semibold mb-1 ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>إعدادات الذكاء الاصطناعي</h4>
                
                <div className="flex flex-col gap-1.5">
                    <label className={`text-xs font-medium ${themeMode === 'light' ? 'text-slate-600' : 'text-blue-200'}`}>اسمك (كيف يناديك؟)</label>
                    <input 
                        type="text" 
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="المتداول"
                        className={`px-3 py-2 text-xs rounded-xl border outline-none ${
                            themeMode === 'light' 
                            ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-400' 
                            : 'bg-slate-800 border-slate-700 text-white focus:border-white'
                        }`}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className={`text-xs font-medium ${themeMode === 'light' ? 'text-slate-600' : 'text-blue-200'}`}>أسلوب وشخصية الردود</label>
                    <textarea 
                        value={botPersona}
                        onChange={(e) => setBotPersona(e.target.value)}
                        placeholder="مباشر وسريع جداً، ادخل في صلب الموضوع"
                        rows={3}
                        className={`px-3 py-2 text-xs rounded-xl border outline-none resize-none ${
                            themeMode === 'light' 
                            ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-400' 
                            : 'bg-slate-800 border-slate-700 text-white focus:border-white'
                        }`}
                    />
                </div>
            </div>
        )}

        <div className="flex items-center gap-2">
            {!isActive && !isConnecting && (
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`w-10 h-10 rounded-full shadow-lg transition-all flex items-center justify-center ${
                        showSettings
                        ? (themeMode === 'light' ? 'bg-slate-200 text-slate-800' : 'bg-slate-700 text-white')
                        : (themeMode === 'light' ? 'bg-white text-slate-500 hover:text-slate-800' : 'bg-slate-800 text-slate-400 hover:text-white')
                    }`}
                    title="إعدادات الصوت"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
            )}
            
            <button
                onClick={toggleCall}
                className={`w-14 h-14 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center overflow-hidden group ${
                    isActive 
                        ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/50' 
                        : (themeMode === 'light' ? 'bg-white text-blue-600 border border-slate-200' : 'bg-slate-800 text-white border border-slate-700')
                }`}
                title="Live Voice Assistant"
            >
                {isConnecting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                ) : isActive ? (
                    <MicOff className="w-6 h-6" />
                ) : (
                    <Mic className="w-6 h-6" />
                )}
                
                {isActive && (
                    <div className="absolute inset-0 rounded-full border-2 border-rose-400 animate-ping opacity-20"></div>
                )}
            </button>
        </div>
    </div>
  );
}
