import re

with open('components/Dashboard.tsx', 'r') as f:
    content = f.read()

# 1. Update Search Instructions
search_old = """            SEARCH TASK 1 (DAILY TECHNICALS): Search Google for TODAY's **Daily Timeframe** Support and Resistance levels for ${selectedItem ? selectedItem.Commodity : "the market"} (e.g., from Investing.com, FXStreet, or TradingView).
             **CRITICAL:** The user trades strictly on the **DAILY timeframe**. Do NOT provide intraday (1H/4H) or weekly levels.
            SEARCH TASK 2 (NEWS): Search for key Geopolitical, Economic, and Political news that affected ${selectedItem ? selectedItem.Commodity : "the market"} recently.
            SEARCH TASK 3 (CALENDAR): Search the upcoming economic calendar (Forex Factory) for the next 7 days."""

search_new = """            SEARCH TASK 1 (DAILY TECHNICALS): Search Google for TODAY's **Daily Timeframe** Support and Resistance levels for ${selectedItem ? selectedItem.Commodity : "the market"} (e.g., from Investing.com, FXStreet, or TradingView).
             **CRITICAL:** The user trades strictly on the **DAILY timeframe**.
            SEARCH TASK 2 (MACRO & GEOPOLITICS - CRITICAL): Search Google News for the most critical **Geopolitical conflicts, Central Bank policies (interest rates/inflation), and Macroeconomic shifts** affecting ${selectedItem ? selectedItem.Commodity : "global markets"} RIGHT NOW. Focus strictly on the last 24-72 hours. These are the fundamental drivers outside of COT.
            SEARCH TASK 3 (CALENDAR): Search the upcoming economic calendar for high-impact events for the next 7 days."""

content = content.replace(search_old, search_new)

# 2. Update Global Context JSON Schema for individual commodity analysis
json_old_1 = """              "global_context": {
                "news_highlights": [
                    "Highlight 1: Recent Geopolitical/Economic development since data release",
                    "Highlight 2: Major political or market event impacting sentiment",
                    "Highlight 3: Another significant factor"
                ],
                "weekly_impact": "Concise conclusion on how these RECENT events + COT data will drive the asset's price this week.",
                "market_sentiment_score": 50, // 0 (Extreme Fear) to 100 (Extreme Greed)
                "key_risks": ["Risk 1", "Risk 2"]
              },"""

json_new_1 = """              "global_context": {
                "news_highlights": [
                    "MACRO/GEO 1: Specific, hard-hitting Geopolitical or Central Bank news from the last 48 hours.",
                    "MACRO/GEO 2: Major economic data or global trade/political shift.",
                    "MACRO/GEO 3: Another pure macroeconomic driver affecting institutional risk appetite."
                ],
                "weekly_impact": "Deep analytical conclusion on how these specific macro/geopolitical events either validate or contradict the COT institutional positioning.",
                "market_sentiment_score": "Number 0-100. 0=Extreme Risk-Off (Safe Havens bid), 100=Extreme Risk-On. Base this purely on macro/geopolitical fears vs. greed.",
                "key_risks": ["Black Swan / Macro Risk 1", "Geopolitical / Economic Risk 2"]
              },"""

content = content.replace(json_old_1, json_new_1)

# 3. Update Global Context JSON Schema for the general market overview
json_old_2 = """              "global_context": {
                "news_highlights": [
                    "Highlight 1: Recent Geopolitical/Economic development",
                    "Highlight 2: Major political or market event",
                    "Highlight 3: Another significant factor"
                ],
                "weekly_impact": "How these RECENT factors will shape global market trends this week.",
                "market_sentiment_score": 50, // 0 (Extreme Fear) to 100 (Extreme Greed)
                "key_risks": ["Risk 1", "Risk 2"]
              },"""

json_new_2 = """              "global_context": {
                "news_highlights": [
                    "MACRO/GEO 1: Specific, hard-hitting Geopolitical or Central Bank news from the last 48 hours.",
                    "MACRO/GEO 2: Major economic data or global trade/political shift.",
                    "MACRO/GEO 3: Another pure macroeconomic driver affecting institutional risk appetite."
                ],
                "weekly_impact": "Deep analytical conclusion on how these specific macro/geopolitical events shape global Risk-On/Risk-Off flows.",
                "market_sentiment_score": "Number 0-100. 0=Extreme Risk-Off (Safe Havens bid), 100=Extreme Risk-On.",
                "key_risks": ["Black Swan / Macro Risk 1", "Geopolitical / Economic Risk 2"]
              },"""

content = content.replace(json_old_2, json_new_2)

with open('components/Dashboard.tsx', 'w') as f:
    f.write(content)
