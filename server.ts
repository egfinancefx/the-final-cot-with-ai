import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import http from "http";
import cors from "cors";
import { tradingAssistantPrompt } from "./agentPrompt.ts";

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured on the server.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  const CANDIDATE_MODELS = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];

  // Helper to execute Gemini requests with automatic fallback across models on 503/429
  async function executeGeminiWithFallback(
    ai: GoogleGenAI,
    contents: any,
    config: any = {},
    preferredModel: string = "gemini-3.1-flash-lite"
  ): Promise<string> {
    const modelsToTry = [
      preferredModel,
      ...CANDIDATE_MODELS.filter((m) => m !== preferredModel)
    ];

    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          ...(Object.keys(config).length > 0 ? { config } : {})
        });
        if (response && typeof response.text === "string") {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.code;
        // If 503 (high demand) or 429 (rate limit/quota), seamlessly attempt next model
        if (status === 503 || status === 429 || status === 500) {
          continue;
        }
        // If tools caused the failure, try without tools
        if (config.tools) {
          try {
            const fallbackConfig = { ...config };
            delete fallbackConfig.tools;
            const fallbackRes = await ai.models.generateContent({
              model,
              contents,
              ...(Object.keys(fallbackConfig).length > 0 ? { config: fallbackConfig } : {})
            });
            if (fallbackRes && typeof fallbackRes.text === "string") {
              return fallbackRes.text;
            }
          } catch (retryErr) {
            lastError = retryErr;
            continue;
          }
        }
      }
    }
    throw lastError;
  }

  // API Route for standard text / analysis generation
  app.post("/api/gemini", async (req, res) => {
    try {
      const { prompt, model = "gemini-3.1-flash-lite", systemInstruction, tools, responseMimeType } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      const ai = getGeminiClient();
      const config: any = {};
      if (systemInstruction) config.systemInstruction = systemInstruction;
      if (tools) config.tools = tools;
      if (responseMimeType) config.responseMimeType = responseMimeType;

      const text = await executeGeminiWithFallback(ai, prompt, config, model);
      res.json({ text: text || "" });
    } catch (e: any) {
      const isQuota = e?.status === 429 || (e?.message && (e.message.includes("quota") || e.message.includes("RESOURCE_EXHAUSTED")));
      const isOverloaded = e?.status === 503;
      res.status(isQuota ? 429 : isOverloaded ? 503 : 500).json({ 
        error: isQuota 
          ? "You exceeded your current Gemini API quota. Please check your plan and billing details, or try again in a moment."
          : isOverloaded
          ? "The AI model is experiencing high demand. Please try again shortly."
          : (e.message || "Failed to generate content"),
        status: isQuota ? 429 : isOverloaded ? 503 : 500,
        isQuotaExceeded: isQuota
      });
    }
  });

  // API Route for multi-turn chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history = [], systemInstruction, model = "gemini-3.1-flash-lite" } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      const ai = getGeminiClient();
      const contents: any[] = [];
      if (Array.isArray(history)) {
        for (const item of history) {
          if (item && item.text) {
            contents.push({
              role: item.role === 'model' ? 'model' : 'user',
              parts: [{ text: item.text }]
            });
          }
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const config: any = {};
      if (systemInstruction) config.systemInstruction = systemInstruction;

      const text = await executeGeminiWithFallback(ai, contents, config, model);
      res.json({ text: text || "" });
    } catch (e: any) {
      const isQuota = e?.status === 429 || (e?.message && (e.message.includes("quota") || e.message.includes("RESOURCE_EXHAUSTED")));
      const isOverloaded = e?.status === 503;
      res.status(isQuota ? 429 : isOverloaded ? 503 : 500).json({ 
        error: isQuota
          ? "عذراً، تم تجاوز حد استهلاك خدمة الذكاء الاصطناعي (Quota Exceeded) مؤقتاً. يرجى المحاولة بعد قليل."
          : isOverloaded
          ? "عذراً، هناك ضغط مرتفع على خوادم الذكاء الاصطناعي حالياً، يرجى إعادة المحاولة بعد لحظات."
          : (e.message || "Failed to process chat"),
        status: isQuota ? 429 : isOverloaded ? 503 : 500,
        isQuotaExceeded: isQuota
      });
    }
  });

  // Commodity to Yahoo Finance ticker mapping
  const COMMODITY_YAHOO_MAP: Record<string, string> = {
    "Gold": "GC=F",
    "Silver": "SI=F",
    "High Grade Copper": "HG=F",
    "Platinum": "PL=F",
    "Palladium": "PA=F",
    "Crude Oil WTI": "CL=F",
    "Natural Gas": "NG=F",
    "ULSD NY Harbor": "HO=F",
    "Gasoline RBOB": "RB=F",
    "Euro FX": "EURUSD=X",
    "British Pound": "GBPUSD=X",
    "Japanese Yen": "JPY=X",
    "Canadian Dollar": "CAD=X",
    "Australian Dollar": "AUDUSD=X",
    "Swiss Franc": "CHF=X",
    "New Zealand Dollar": "NZDUSD=X",
    "Mexican Peso": "MXN=X",
    "Brazilian Real": "BRL=X",
    "South African Rand": "ZAR=X",
    "U.S. Dollar Index": "DX-Y.NYB",
    "Bitcoin Micro": "BTC-USD",
    "Ether Micro": "ETH-USD",
    "Dow Futures Mini": "YM=F",
    "S&P 500 E-Mini": "ES=F",
    "Nasdaq 100 E-Mini": "NQ=F",
    "S&P 500 VIX": "^VIX",
    "Russell 2000 E-Mini": "RTY=F",
    "Corn": "ZC=F",
    "Soybeans": "ZS=F",
    "Soybean Oil": "ZL=F",
    "Soybean Meal": "ZM=F",
    "Wheat": "ZW=F",
    "Live Cattle": "LE=F",
    "Feeder Cattle": "GF=F",
    "Lean Hogs": "HE=F",
    "Cotton #2": "CT=F",
    "Coffee": "KC=F",
    "Sugar #11": "SB=F",
    "Cocoa": "CC=F",
    "10-Year T-Note": "ZN=F",
    "30-Year T-Bond": "ZB=F",
    "5-Year T-Note": "ZF=F",
    "2-Year T-Note": "ZT=F"
  };

  const marketPriceCache = new Map<string, { data: any; timestamp: number }>();

  // API Route to get live spot market price for any commodity
  app.get("/api/market-price", async (req, res) => {
    try {
      const commodity = (req.query.commodity as string) || "";
      const ticker = COMMODITY_YAHOO_MAP[commodity] || (req.query.ticker as string);

      if (!ticker) {
        return res.status(400).json({ error: "Commodity ticker mapping not found", commodity });
      }

      const cached = marketPriceCache.get(ticker);
      const now = Date.now();
      if (cached && now - cached.timestamp < 45 * 1000) {
        return res.json(cached.data);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      // Fetch daily for current price
      const yRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      });
      clearTimeout(timeout);

      if (!yRes.ok) throw new Error(`Yahoo Finance responded with status ${yRes.status}`);
      const yData: any = await yRes.json();
      const meta = yData.chart?.result?.[0]?.meta;
      if (!meta || meta.regularMarketPrice === undefined) throw new Error("No price metadata available");

      const price = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose || price;
      const change = Number((price - prevClose).toFixed(4));
      const changePercent = Number((((price - prevClose) / prevClose) * 100).toFixed(2));

      // Fetch weekly for Pivot Points
      let weeklyHigh = meta.regularMarketDayHigh || price;
      let weeklyLow = meta.regularMarketDayLow || price;
      let weeklyClose = prevClose;

      try {
        const wRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1wk&range=1mo`, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        const wData: any = await wRes.json();
        const wResult = wData.chart?.result?.[0];
        if (wResult && wResult.indicators?.quote?.[0]) {
            const quote = wResult.indicators.quote[0];
            // Get the last completed week (usually index length - 2 or - 1 depending on if current week is open)
            // Just find the last valid close that is not the current live price
            let lastIdx = quote.close.length - 2;
            if (lastIdx < 0) lastIdx = 0;
            if (quote.high[lastIdx] != null) weeklyHigh = quote.high[lastIdx];
            if (quote.low[lastIdx] != null) weeklyLow = quote.low[lastIdx];
            if (quote.close[lastIdx] != null) weeklyClose = quote.close[lastIdx];
        }
      } catch (e) {
        console.warn("Could not fetch weekly data for pivots", e);
      }

      // Calculate Classic Pivot Points
      const pp = (weeklyHigh + weeklyLow + weeklyClose) / 3;
      const r1 = (2 * pp) - weeklyLow;
      const r2 = pp + (weeklyHigh - weeklyLow);
      const s1 = (2 * pp) - weeklyHigh;
      const s2 = pp - (weeklyHigh - weeklyLow);

      const responseData = {
        commodity,
        ticker,
        price,
        high: meta.regularMarketDayHigh || price,
        low: meta.regularMarketDayLow || price,
        prevClose,
        change,
        changePercent,
        currency: meta.currency || "USD",
        pivots: {
            pp: Number(pp.toFixed(2)),
            r1: Number(r1.toFixed(2)),
            r2: Number(r2.toFixed(2)),
            s1: Number(s1.toFixed(2)),
            s2: Number(s2.toFixed(2)),
            weeklyClose: Number(weeklyClose.toFixed(2))
        }
      };

      marketPriceCache.set(ticker, { data: responseData, timestamp: now });
      res.json(responseData);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch live market price" });
    }
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/live' });

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
            let ai: GoogleGenAI;
            try {
              ai = getGeminiClient();
            } catch (initErr: any) {
              clientWs.send(JSON.stringify({ error: initErr.message }));
              return;
            }

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
                responseModalities: ["AUDIO"] as Modality[],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
