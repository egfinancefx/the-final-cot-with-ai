import { GoogleGenAI } from "@google/genai";
async function run() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const res = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: "What is the price of gold today? Search Google.",
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: "You are an elite, institutional-grade trading mentor and macro-analyst. Your analysis is deep, multi-layered, and highly strategic. You avoid generic platitudes; instead, you provide precise, hedge-fund level tactical execution plans and deep market structural insights. Always ground your advice in the COT data, live prices, and recent macroeconomic news. You have access to Google Search; ALWAYS search for TODAY'S DAILY TIMEFRAME technical support and resistance levels from sites like Investing.com or TradingView. The user trades STRICTLY on the DAILY timeframe. Be highly detailed, decisive, and professional. Return ONLY valid JSON.",
                responseMimeType: "application/json"
            }
        });
        console.log("Success:", res.text.substring(0, 150));
    } catch(e: any) { console.error("Error:", e.message); }
}
run();
