import re

with open('server.ts', 'r') as f:
    content = f.read()

# Locate the /api/market-price endpoint
# We want to fetch 1wk range=1mo to get the weekly high/low/close

new_endpoint = """  app.get("/api/market-price", async (req, res) => {
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
  });"""

content = re.sub(r'  app\.get\("/api/market-price", async \(req, res\) => \{.*?    \} catch \(err: any\) \{\n      res\.status\(500\)\.json\(\{ error: err\.message \|\| "Failed to fetch live market price" \}\);\n    \}\n  \}\);', new_endpoint, content, flags=re.DOTALL)

with open('server.ts', 'w') as f:
    f.write(content)
