import re

with open('components/Dashboard.tsx', 'r') as f:
    content = f.read()

quote_context_old = """            REAL-TIME LIVE SPOT MARKET DATA (MANDATORY TECHNICAL ANCHOR):
            - Current Spot Price: $${liveQuote.price} ${liveQuote.currency || "USD"}
            - Day Range: Low $${liveQuote.low} - High $${liveQuote.high}
            - Previous Close: $${liveQuote.prevClose}
            - Intraday Momentum: ${liveQuote.changePercent > 0 ? '+' : ''}${liveQuote.changePercent}%

            CRITICAL DIRECTIVES FOR REALISTIC KEY PRICE LEVELS:
            - The actual live market price is strictly $${liveQuote.price}. ALL key price levels MUST be realistic, specific NUMERICAL prices centered directly around $${liveQuote.price}.
            - DO NOT output generic descriptions without concrete prices. State the exact numerical price first, followed by institutional technical context (e.g. Order Block, Liquidity Pool, VWAP).
            - "current_price": "$${liveQuote.price}"
            - "resistance": Realistic near-term ceiling price ABOVE $${liveQuote.price} (R1 - e.g. Buy-side Liquidity Pool / Previous Session High)
            - "resistance_2": Higher structural resistance price (R2 - e.g. Major Supply Zone / Weekly High)
            - "pivot_point": Equilibrium balance price near $${liveQuote.price} (PP - e.g. Weekly Volume-Weighted Pivot)
            - "support": Realistic near-term floor price BELOW $${liveQuote.price} (S1 - e.g. Bullish Order Block / Previous Session Low)
            - "support_2": Deeper discount demand price (S2 - e.g. Macro Institutional Demand / Liquidity Void)
            - "invalidation_level": The exact price where a daily close invalidates the institutional COT thesis."""

quote_context_new = """            REAL-TIME LIVE MARKET DATA & CALCULATED PIVOT POINTS (MANDATORY TECHNICAL ANCHOR):
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

content = content.replace(quote_context_old, quote_context_new)

with open('components/Dashboard.tsx', 'w') as f:
    f.write(content)
