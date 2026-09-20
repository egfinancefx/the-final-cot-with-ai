import { GoogleGenAI } from "@google/genai";
async function run() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const res = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: "Hi, are you working?",
        });
        console.log("3.6-flash:", res.text);
    } catch(e: any) { console.error("3.6 error:", e.message); }
    try {
        const res = await ai.models.generateContent({
            model: "gemini-3.1-flash",
            contents: "Hi, are you working?",
        });
        console.log("3.1-flash:", res.text);
    } catch(e: any) { console.error("3.1 error:", e.message); }
}
run();
