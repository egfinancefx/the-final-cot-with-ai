import re

with open('components/Dashboard.tsx', 'r') as f:
    content = f.read()

# 1. Update the JSON Schema for the response
old_perspective = '"perspective": "Your friendly explanation of the market situation. What is smart money doing?",'
new_perspective = '"perspective": "A deep, comprehensive 3-4 paragraph market thesis. Break down exactly how \'Smart Money\' (institutions) is positioning against retail, how recent macroeconomic/geopolitical events validate or threaten this positioning, and what this structural divergence means for the upcoming daily sessions. Be highly analytical, detailed, and professional.",'

old_actionable_advice = '"actionable_advice": "Specific \'If I Were You\' advice. Tell me exactly what you would do.",'
new_actionable_advice = '"actionable_advice": "A highly detailed, step-by-step tactical trading plan. Define specific conditions for entry (e.g., \'Wait for a liquidity sweep at S1, then look for a daily close above...\'), how you would manage the trade, where you would place stops, and how you would scale out based on the structural bias. Speak as an elite institutional trader sharing a precise playbook.",'

content = content.replace(old_perspective, new_perspective)
content = content.replace(old_actionable_advice, new_actionable_advice)


# 2. Update the general market overview JSON schema just in case
old_gen_perspective = '"perspective": "Big picture market themes and drivers.",'
new_gen_perspective = '"perspective": "A deep, comprehensive 3-4 paragraph macro thesis. Analyze the massive capital flows between asset classes (Metals vs. Currencies vs. Indices) based on the COT data. What is the overarching theme \'Smart Money\' is pricing in?",'

old_gen_actionable_advice = '"actionable_advice": "Which assets to watch and where the opportunities are.",'
new_gen_actionable_advice = '"actionable_advice": "Specific, actionable macro opportunities. Identify 2-3 specific assets that have the highest probability of directional momentum this week, and detail exactly how to approach them tactically on the daily timeframe.",'

content = content.replace(old_gen_perspective, new_gen_perspective)
content = content.replace(old_gen_actionable_advice, new_gen_actionable_advice)


# 3. Upgrade the AI System Instruction (Persona)
old_system_instruction = 'systemInstruction: "You are a friendly, experienced trading mentor. You explain things simply and clearly. You are not a robot; you are a helpful guide. Always ground your advice in the data and news provided. You have access to Google Search; ALWAYS search for TODAY\'S DAILY TIMEFRAME technical support and resistance levels from sites like Investing.com or TradingView. The user trades STRICTLY on the DAILY timeframe. Be decisive but responsible. Return ONLY valid JSON."'
new_system_instruction = 'systemInstruction: "You are an elite, institutional-grade trading mentor and macro-analyst. Your analysis is deep, multi-layered, and highly strategic. You avoid generic platitudes; instead, you provide precise, hedge-fund level tactical execution plans and deep market structural insights. Always ground your advice in the COT data, live prices, and recent macroeconomic news. You have access to Google Search; ALWAYS search for TODAY\'S DAILY TIMEFRAME technical support and resistance levels from sites like Investing.com or TradingView. The user trades STRICTLY on the DAILY timeframe. Be highly detailed, decisive, and professional. Return ONLY valid JSON."'

content = content.replace(old_system_instruction, new_system_instruction)

with open('components/Dashboard.tsx', 'w') as f:
    f.write(content)
