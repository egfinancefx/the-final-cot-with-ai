import re

with open('components/Dashboard.tsx', 'r') as f:
    content = f.read()

search_instruction_old = """            SEARCH TASK 1 (Context): Search for key **Geopolitical, Economic, and Political** news that affected ${selectedItem ? selectedItem.Commodity : "the market"}. 
             **CRITICAL:** Focus specifically on the period from **${latestDate || "recent past"}** to **TODAY (${today})**. What has happened SINCE the data was released?
            SEARCH TASK 2 (Forward Looking): Search for the **upcoming economic calendar** for ${selectedItem ? selectedItem.Commodity : "major global markets"} for the next 7 days starting from today, ${today}. 
             **CRITICAL:** Look for high-impact events on **Forex Factory** or similar reliable economic calendars. 
             **MANDATORY:** You MUST specifically check for upcoming **Unemployment Claims** data if relevant to the asset (especially for USD pairs/Indices)."""

search_instruction_new = """            SEARCH TASK 1 (DAILY TECHNICALS): Search Google for TODAY's **Daily Timeframe** Support and Resistance levels for ${selectedItem ? selectedItem.Commodity : "the market"} (e.g., from Investing.com, FXStreet, or TradingView).
             **CRITICAL:** The user trades strictly on the **DAILY timeframe**. Do NOT provide intraday (1H/4H) or weekly levels.
            SEARCH TASK 2 (NEWS): Search for key Geopolitical, Economic, and Political news that affected ${selectedItem ? selectedItem.Commodity : "the market"} recently.
            SEARCH TASK 3 (CALENDAR): Search the upcoming economic calendar (Forex Factory) for the next 7 days."""

content = content.replace(search_instruction_old, search_instruction_new)

quote_context_old = """            REAL-TIME LIVE MARKET DATA & CALCULATED PIVOT POINTS (MANDATORY TECHNICAL ANCHOR):
            - Current Price: $${liveQuote.price} ${liveQuote.currency || "USD"}
            - Weekly Close (Previous): $${liveQuote.pivots ? liveQuote.pivots.weeklyClose : liveQuote.prevClose}
            - Day Range: Low $${liveQuote.low} - High $${liveQuote.high}
            
            MATHEMATICALLY CALCULATED KEY LEVELS (YOU MUST USE THESE EXACT NUMBERS):
            - Pivot Point (PP): $${liveQuote.pivots ? liveQuote.pivots.pp : liveQuote.price}
            - Resistance 1 (R1): $${liveQuote.pivots ? liveQuote.pivots.r1 : liveQuote.price + 10}
            - Resistance 2 (R2): $${liveQuote.pivots ? liveQuote.pivots.r2 : liveQuote.price + 20}
            - Support 1 (S1): $${liveQuote.pivots ? liveQuote.pivots.s1 : liveQuote.price - 10}
            - Support 2 (S2): $${liveQuote.pivots ? liveQuote.pivots.s2 : liveQuote.price - 20}

            CRITICAL DIRECTIVES FOR KEY PRICE LEVELS:
            - YOU MUST USE THE EXACT CALCULATED NUMERICAL PRICES PROVIDED ABOVE FOR YOUR RESPONSE. DO NOT INVENT NEW NUMBERS.
            - Append brief technical context to the number (e.g., "$4349.00 - Weekly Pivot Point").
            - "current_price": "$${liveQuote.price} (Weekly Close: $${liveQuote.pivots ? liveQuote.pivots.weeklyClose : ''})"
            - "resistance": "$${liveQuote.pivots ? liveQuote.pivots.r1 : ''} - Tactical R1"
            - "resistance_2": "$${liveQuote.pivots ? liveQuote.pivots.r2 : ''} - Major R2"
            - "pivot_point": "$${liveQuote.pivots ? liveQuote.pivots.pp : ''} - Weekly Pivot"
            - "support": "$${liveQuote.pivots ? liveQuote.pivots.s1 : ''} - Tactical S1"
            - "support_2": "$${liveQuote.pivots ? liveQuote.pivots.s2 : ''} - Major S2"
            - "invalidation_level": "State a price that invalidates the thesis based on the levels above." """

quote_context_new = """            REAL-TIME MARKET DATA (ANCHOR):
            - Current Spot Price: $${liveQuote.price} ${liveQuote.currency || "USD"}
            - Previous Close: $${liveQuote.prevClose}
            
            CRITICAL DIRECTIVES FOR DAILY TIMEFRAME KEY PRICE LEVELS:
            - The user strictly operates on the **DAILY TIMEFRAME**. 
            - You MUST use the Google Search tool to find highly accurate **Daily Timeframe Support and Resistance** levels for ${selectedItem.Commodity} from reputable sources like Investing.com or TradingView.
            - DO NOT invent numbers. If you cannot find accurate Daily levels via search, calculate them strictly based on Daily structural logic, but prioritize SEARCH.
            - "current_price": "$${liveQuote.price}"
            - "resistance": "Exact numerical price - Daily Resistance 1 (e.g., from Investing.com)"
            - "resistance_2": "Exact higher numerical price - Daily Resistance 2"
            - "pivot_point": "Exact numerical price - Daily Pivot or Liquidity Level"
            - "support": "Exact numerical price - Daily Support 1"
            - "support_2": "Exact lower numerical price - Daily Support 2"
            - "invalidation_level": "The exact daily close price that invalidates your thesis." """

content = content.replace(quote_context_old, quote_context_new)

# Add tools to fetch request
fetch_old = """        const apiRes = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemini-3.1-flash-lite',
                prompt,
                responseMimeType: "application/json",
                systemInstruction: "You are a friendly, experienced trading mentor. You explain things simply and clearly. You are not a robot; you are a helpful guide. Always ground your advice in the data and news provided. Be decisive but responsible. Return ONLY valid JSON."
            })
        });"""

fetch_new = """        const apiRes = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemini-3.1-flash',
                prompt,
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                systemInstruction: "You are a friendly, experienced trading mentor. You explain things simply and clearly. You are not a robot; you are a helpful guide. Always ground your advice in the data and news provided. You have access to Google Search; ALWAYS search for TODAY'S DAILY TIMEFRAME technical support and resistance levels from sites like Investing.com or TradingView. The user trades STRICTLY on the DAILY timeframe. Be decisive but responsible. Return ONLY valid JSON."
            })
        });"""

content = content.replace(fetch_old, fetch_new)

with open('components/Dashboard.tsx', 'w') as f:
    f.write(content)
