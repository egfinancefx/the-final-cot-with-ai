import { GoogleGenAI } from "@google/genai";
async function run() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const res = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: "Tell me a joke.",
        });
        console.log("3.6-flash success:", res.text.substring(0, 50));
    } catch(e: any) { console.error("3.6 error:", e.message); }
}
run();
