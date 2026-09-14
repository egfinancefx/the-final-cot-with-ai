import fetch from "node-fetch";

async function run() {
  const prompt = `Act as an elite, institutional-grade trading mentor. Speak directly to me (the user) in a decisive, data-driven, and highly analytical tone. No fluff.
            Analyze this COT report data for Gold:
            Today is Monday, October 2, 2023.
            Current Data:
            - Net Position: 100000
            - Net Change (Weekly): 5000
            - Long Positions: 200000 (Change: 4000)
            - Short Positions: 100000 (Change: -1000)
            Historical Net Positions (Past 6 Weeks, newest to oldest): 
            [100000, 95000, 90000, 85000, 80000, 75000]

            CRITICAL DIRECTIVES FOR REALISTIC KEY PRICE LEVELS:
            - You MUST provide realistic, concrete numerical price levels (not generic descriptions) reflecting current real-world market prices for Gold.
            - Always state the exact numerical price first (e.g., "$2,915.50 - Institutional Order Block"), followed by the technical reasoning.
            
            
            Context Task: Incorporate the most critical **Geopolitical, Economic, and Political** drivers currently affecting Gold based on your training data and current macro themes.
            Forward Looking Task (Trader Playbook): Predict the types of **upcoming economic events** that would typically impact Gold (e.g., NFP, CPI, FOMC, Unemployment Claims) and explain how the market would react based on the current COT positioning.
        
            
            You MUST return the response in valid JSON format with the following structure. Do not use Markdown formatting outside the JSON strings.
            {
              "sentiment": {
                "label": "Bullish" | "Bearish" | "Neutral",
                "reason": "Brief 1-sentence analytical reason based on COT flow and price."
              },
              "perspective": "Deep, elite-level analysis combining the 6-week COT trend with current geopolitical/macro news. Explain exactly what institutional 'smart money' is doing and WHY, using real-world drivers. Do NOT be vague.",
              "actionable_advice": "Specific 'If I Were You' advice. Provide a concrete, highly realistic trading strategy. Tell me exactly what you would do right now based on the daily timeframe, current price, and COT trend.",
              "key_levels": {
                "current_price": "$1900.00",
                "resistance": "Exact numerical price (e.g. $4,485.50) - Tactical R1 resistance / Liquidity sweep",
                "resistance_2": "Exact higher numerical price (e.g. $4,510.00) - Major R2 supply zone",
                "pivot_point": "Exact numerical price (e.g. $4,455.00) - Weekly equilibrium PP",
                "support": "Exact numerical price (e.g. $4,432.00) - Tactical S1 support / Bullish Order Block",
                "support_2": "Exact lower numerical price (e.g. $4,410.00) - S2 discount demand pool",
                "invalidation_level": "Exact numerical price (e.g. $4,395.00) - Structural thesis invalidation"
              },
              "institutional_bias": "Specific analysis of the change in Long vs Short positions and what that means for upcoming volatility.",
              "global_context": {
                "news_highlights": [
                    "MACRO/GEO 1: Specific, real geopolitical or economic news from the last 48 hours affecting this asset.",
                    "MACRO/GEO 2: Real economic data point or global trade shift.",
                    "MACRO/GEO 3: Another pure macroeconomic driver affecting institutional risk appetite."
                ],
                "weekly_impact": "Deep analytical conclusion on how these specific events validate or contradict the COT institutional positioning.",
                "market_sentiment_score": "Number 0-100. 0=Extreme Risk-Off, 100=Extreme Risk-On.",
                "key_risks": ["Real, specific Macro Risk 1", "Real, specific Geopolitical Risk 2"]
              },
              "playbook": [
                {
                  "event": "Upcoming Economic Event Type (e.g., US CPI, FOMC, NFP)",
                  "date": "Expected Timeframe",
                  "forecast": "Typical Market Expectation",
                  "plan": "Specific trading plan (e.g., 'If CPI prints > forecast, look to short $Commodity at R1')",
                  "why": "Institutional reasoning based on yield/dollar dynamics",
                  "when_to_act": "Specific timing (e.g., 'Wait for 15m candle close post-release')",
                  "impact_if_deviates": "What exactly happens to this asset if actual != forecast"
                }
              ]
            }`;

  const res = await fetch("http://localhost:3000/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      model: "gemini-3.6-flash",
      responseMimeType: "application/json",
      systemInstruction: "You are an elite, institutional-grade trading mentor. You analyze data with cold, hard logic. You are highly specific and data-driven. Always ground your advice in real-world macroeconomic drivers and current market data. The user trades STRICTLY on the DAILY timeframe. Be decisive, concrete, and responsible. Return ONLY valid JSON."
    })
  });
  console.log(res.status);
  console.log(await res.text());
}
run();
