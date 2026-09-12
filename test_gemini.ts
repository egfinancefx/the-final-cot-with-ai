import { GoogleGenAI } from "@google/genai";
async function run() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const res = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: "What is the price of gold right now? Search Google.",
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        console.log(res.text);
    } catch(e) { console.error(e.message); }
}
run();
