const fs = require('fs');

let content = fs.readFileSync('utils.ts', 'utf8');

const regex = /const data = \{[\s\S]*?\n  \};\n  return JSON\.stringify\(data, null, 2\);/g;

const newData = `const data = {
    sentiment: {
      label: sentimentLabel,
      reason: isAsset
        ? \`Institutional positioning changed by \${netChange > 0 ? '+' : ''}\${netChange.toLocaleString()} contracts to reach a net position of \${netPos.toLocaleString()} contracts.\`
        : "Macro institutional flows show distinct positioning shifts across major asset sectors."
    },
    perspective: isAsset
      ? \`Structural Market Thesis: Smart Money vs. Retail Dynamics\\n\\nThe Commitment of Traders (COT) data reveals a highly distinct positioning structure for \${commodity}. Institutional participants and commercial hedgers are currently heavily skewed \${netPos >= 0 ? 'NET LONG' : 'NET SHORT'}, holding \${Math.abs(netPos).toLocaleString()} net contracts. The most recent reporting period saw an aggressive \${isBullish ? 'accumulation' : 'distribution'} phase of \${Math.abs(netChange).toLocaleString()} contracts, indicating that the 'Smart Money' is actively front-running anticipated macroeconomic shifts.\\n\\nWhen we contextualize this directional flow against the broader geopolitical landscape and recent central bank rhetoric, we see a clear institutional conviction. Retail traders are likely caught offsides, fading this structural trend. This divergence creates a highly asymmetric daily timeframe opportunity. The institutional footprint is undeniable: they are absorbing liquidity at discount levels and building massive inventory for a sustained \${isBullish ? 'bullish markup' : 'bearish markdown'} phase.\`
      : \`Macro Structural Thesis: Cross-Asset Institutional Flows\\n\\nThe aggregate Commitment of Traders (COT) data reveals massive rotational capital flows across global asset classes. We are witnessing a clear divergence where 'Smart Money' is aggressively reallocating capital in response to shifting central bank liquidity cycles and geopolitical friction.\\n\\nMetals, currencies, and energy are completely decoupling. The institutional footprint shows distinct accumulation in specific safe-haven or high-yield assets, while actively liquidating exposure in highly levered risk-on sectors. This is not a retail-driven market; this is a pure, systematic institutional rotation. Understanding these hidden flows provides a massive edge for daily timeframe positioning, allowing us to align with the deepest pockets in the market.\`,
    actionable_advice: isAsset
      ? \`Tactical 'If I Were You' Playbook (Daily Timeframe):\\n\\n1. Directional Bias: Strictly \${isBullish ? 'LONG (Buy the dips)' : 'SHORT (Sell the rallies)'} based on the massive institutional \${isBullish ? 'accumulation' : 'distribution'}. Do not counter-trend trade this asset.\\n2. Entry Condition (The Setup): Wait patiently for the daily price action to sweep retail liquidity at the tactical \${isBullish ? 'Support (S1)' : 'Resistance (R1)'} zone. Do not enter randomly; let the price come to the calculated institutional equilibrium.\\n3. Execution Trigger: We need a clear DAILY CLOSE that rejects the \${isBullish ? 'S1/S2 discount zones' : 'R1/R2 premium zones'}. A strong rejection candle (pin bar or engulfing) confirms the Smart Money is defending their average entry price.\\n4. Risk Management: Hard stop-loss placed exactly below the Structural Invalidation Level. If the daily candle closes beyond this line, our institutional thesis is broken and we exit immediately.\\n5. Profit Targets: Scale out 50% of the position at the first major liquidity pool (R1 for longs, S1 for shorts), and hold the runner towards the extreme R2/S2 targets.\`
      : \`Tactical Macro Playbook:\\n\\n1. Asset Selection: Isolate the 2 or 3 specific commodities/currencies showing the most aggressive week-over-week Net Change in institutional positioning. Ignore the rest.\\n2. Execution Framing: Wait for major macroeconomic data releases (e.g., NFP, CPI) to create artificial 'whipsaws'. Use these engineered liquidity sweeps to enter in the direction of the dominant COT trend.\\n3. Risk Management: Never trade the initial news spike. Wait for the New York session daily close to confirm the true institutional intent before committing capital.\`,
    key_levels: keyLevelsObj,
    institutional_bias: isAsset
      ? \`\${isBullish ? 'Accumulation' : 'Distribution'} (Weekly shift: \${netChange > 0 ? '+' : ''}\${netChange.toLocaleString()} contracts)\`
      : "Rotational institutional flows across macro assets",
    global_context: {
      news_highlights: [
        "Commitment of Traders (COT) weekly reporting reflects commercial and non-commercial positioning.",
        "Macro drivers including Dollar Index (DXY) and interest rate expectations drive directional trend momentum.",
        "Upcoming economic calendar events should be monitored for potential volatility expansions."
      ],
      weekly_impact: "Price direction will likely track institutional positioning continuity along with macroeconomic releases.",
      market_sentiment_score: isStrongBull ? 72 : isStrongBear ? 28 : 50,
      key_risks: ["Unexpected central bank statements", "Geopolitical developments", "Calendar data deviations"]
    },
    playbook: [
      {
        event: "Weekly Market Structure Review",
        date: "Current Trading Session",
        forecast: "Institutional continuation",
        plan: "Wait for structure confirmation at key technical levels",
        why: "Trading in direction of institutional positioning enhances probability",
        when_to_act: "On test of key liquidity or support/resistance zones",
        impact_if_deviates: "Invalidates directional thesis; reassess positioning"
      }
    ]
  };
  return JSON.stringify(data, null, 2);`

content = content.replace(regex, newData);

fs.writeFileSync('utils.ts', content);
