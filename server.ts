import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import http from "http";
import cors from "cors";
import { tradingAssistantPrompt } from "./agentPrompt.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Route for standard text chat / generation (optional, can be used later)
  app.post("/api/gemini", async (req, res) => {
    try {
      const { prompt, model = "gemini-3.1-flash-lite" } = req.body;
      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY
      });
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });
      res.json({ text: response.text });
    } catch (e: any) {
      console.error("API error", e);
      res.status(500).json({ error: e.message });
    }
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/live' });

  // Initialize Gemini for Live API
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY
  });

  // Cached live prices with fast timeout
  let cachedLivePrices = "";
  let lastPriceFetchTime = 0;

  const getLivePrices = async (): Promise<string> => {
    const now = Date.now();
    if (cachedLivePrices && now - lastPriceFetchTime < 5 * 60 * 1000) {
      return cachedLivePrices;
    }
    const symbols = {
      'الذهب': 'GC=F', 'النفط الخام': 'CL=F', 'اليورو': 'EURUSD=X', 'الباوند': 'GBPUSD=X',
      'الين الياباني': 'JPY=X', 'البيتكوين': 'BTC-USD', 'الفضة': 'SI=F', 'الغاز الطبيعي': 'NG=F',
      'مؤشر ناسداك': 'NQ=F', 'مؤشر إس آند بي 500': 'ES=F'
    };
    try {
      const fetchPromises = Object.entries(symbols).map(async ([name, ticker]) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 1200);
          const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1m&range=1d`, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          clearTimeout(timeout);
          const json: any = await res.json();
          const price = json.chart?.result?.[0]?.meta?.regularMarketPrice;
          if (price) return `- ${name}: ${price}`;
        } catch(e) { return null; }
        return null;
      });
      const results = await Promise.all(fetchPromises);
      const valid = results.filter(Boolean);
      if (valid.length > 0) {
        cachedLivePrices = "أسعار السوق الحالية المباشرة (Live Prices):\n" + valid.join('\n') + "\n\n";
        lastPriceFetchTime = now;
        return cachedLivePrices;
      }
    } catch (e) {}
    return cachedLivePrices || "أسعار السوق الحية غير متاحة حالياً.\n\n";
  };

  wss.on("connection", (clientWs: WebSocket) => {
    console.log("Client connected to /live");
    let session: any = null;

    clientWs.on("message", async (data) => {
      try {
        const parsed = JSON.parse(data.toString());

        if (parsed.type === "setup") {
            const today = new Date();
            const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const todayStr = today.toLocaleDateString('ar-EG', dateOptions);

            const livePricesContext = await getLivePrices();
            
            // Extract user preferences if provided
            const userName = parsed.userName ? parsed.userName : "المتداول";
            const botPersona = parsed.botPersona ? parsed.botPersona : "مباشر ومحترف";

            const systemInstruction = `${tradingAssistantPrompt}

أنت المساعد الذكي والصوتي المتخصص لدى EG-Finance Fx. اسمك المساعد المالي واسم المستخدم الذي تتحدث معه هو "${userName}".
أسلوبك وشخصيتك المطلوبة من المستخدم: "${botPersona}".
تاريخ اليوم هو: ${todayStr}.

${livePricesContext}
بيانات تقرير COT الحالية والتاريخية (لآخر 5 أسابيع):
${parsed.data}`;

            session = await ai.live.connect({
                model: "gemini-3.1-flash-live-preview",
                config: {
                responseModalities: ["AUDIO"] as Modality[], // Modality.AUDIO
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }, // Kept one of the voices, Aoede is nice. Or Zephyr.
                },
                systemInstruction: systemInstruction
                },
                callbacks: {
                    onopen: () => { console.log("Gemini WebSocket OPENED"); },
                    onerror: (e) => { 
                        console.error("Gemini WebSocket ERROR", e); 
                        clientWs.send(JSON.stringify({ error: "Gemini WS Error: " + String(e) }));
                    },
                    onclose: (e) => { 
                        console.log("Gemini WebSocket CLOSED", e.code, e.reason); 
                        clientWs.send(JSON.stringify({ error: "Gemini WS Closed: " + e.code + " " + e.reason }));
                    },
                    onmessage: (message: LiveServerMessage) => {
                        try {
                            fs.writeFileSync('debug.log', JSON.stringify(message) + '\n', { flag: 'a' });
                        } catch (e) {}
                        if (message.serverContent?.modelTurn?.parts) {
                            for (const part of message.serverContent.modelTurn.parts) {
                                const audio = part.inlineData?.data;
                                if (audio) {
                                    clientWs.send(JSON.stringify({ audio }));
                                }
                            }
                        }
                        if (message.serverContent?.interrupted) {
                            clientWs.send(JSON.stringify({ interrupted: true }));
                        }
                    }
                }
            });
            clientWs.send(JSON.stringify({ ready: true }));
            
            // Prompt the AI to start speaking immediately
            if (session) {
                try {
                    session.sendClientContent({ turns: `مرحباً! لقد اتصلت للتو. رحب بي (اسمي: ${userName}) واطلب مني كيف يمكن أن تساعدني، التزم بشخصيتك: ${botPersona}`, turnComplete: true });
                } catch (err: any) {
                    clientWs.send(JSON.stringify({ error: "Init Error: " + err.message }));
                }
            }

        } else if (parsed.audio && session) {
            session.sendRealtimeInput({
                audio: {
                    mimeType: "audio/pcm;rate=16000",
                    data: parsed.audio
                }
            });
        } else if (parsed.text && session) {
            session.sendClientContent({ turns: parsed.text, turnComplete: true });
        }
      } catch (e: any) {
        console.error("Error processing client message", e);
        clientWs.send(JSON.stringify({ error: e.message || String(e) }));
      }
    });

    clientWs.on("close", () => {
      console.log("Client disconnected");
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
