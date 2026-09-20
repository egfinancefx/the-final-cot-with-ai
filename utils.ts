import { twMerge } from "tailwind-merge";
import { type ClassValue, clsx } from "clsx";

import { SummaryRow, HistoryRow } from './types';

// Helper to convert string numbers like "-26,431" to -26431
export const parseNumber = (value: string | number | undefined): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  // Remove quotes and commas
  const clean = value.replace(/["',]/g, '').trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

// Robust CSV Line Splitter that handles quoted fields containing commas
const splitCSVLine = (line: string): string[] => {
  // Use a regex that matches a comma only if it's followed by an even number of quotes
  // This effectively splits by comma while ignoring commas inside quotes
  return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.trim());
};

const cleanCell = (cell: string) => cell ? cell.replace(/^"|"$/g, '').trim() : '';

export const parseSummaryCSV = (csvText: string): SummaryRow[] => {
  const lines = csvText.split('\n').filter(line => {
    const trimmed = line.trim();
    // Filter empty lines and footer lines
    return trimmed !== '' && !trimmed.startsWith('Downloaded from');
  });
  
  const data: SummaryRow[] = [];

  // Start at index 1 to skip header
  for (let i = 1; i < lines.length; i++) {
    const rawCells = splitCSVLine(lines[i]);
    const cells = rawCells.map(cleanCell);
    
    // Ensure we have enough cells and the row isn't just commas
    if (cells.length < 5 || !cells[0]) continue;

    // Note: Indices match raw CSV structure. 
    // 0: Commodity, 1: 52W High, 2: 52W Low (ignored), 3: Net Pos, etc.
    data.push({
      Commodity: cells[0],
      "Net Positions": parseNumber(cells[3]),
      "Net Change": parseNumber(cells[4]),
      "Long Positions": parseNumber(cells[5]),
      "Long Change": parseNumber(cells[6]),
      "Short Positions": parseNumber(cells[7]),
      "Short Change": parseNumber(cells[8]),
    });
  }
  return data;
};

export const parseHistoryCSV = (csvText: string): { data: HistoryRow[], dates: string[] } => {
  const lines = csvText.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed !== '' && !trimmed.startsWith('Downloaded from');
  });
  
  if (lines.length === 0) return { data: [], dates: [] };

  const rawHeader = lines[0];
  const headerCells = splitCSVLine(rawHeader).map(cleanCell);
  
  // We want columns D to I (indices 3 to 8). This represents the newest 6 moves.
  // Col 0=Commodity, Col 1=52W High, Col 2=52W Low.
  // Dates start at index 3.
  const startIndex = 3;
  const count = 6;
  
  // Guard against header being too short
  if (headerCells.length < startIndex + count) {
      return { data: [], dates: [] };
  }

  const dates = headerCells.slice(startIndex, startIndex + count);
  
  const data: HistoryRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCells = splitCSVLine(lines[i]);
    const cells = rawCells.map(cleanCell);

    if (cells.length < 3 || !cells[0]) continue;

    const row: HistoryRow = {
      Commodity: cells[0],
    };

    // Map only the selected 6 dates
    dates.forEach((date, index) => {
      // The value for this date is at startIndex + index in the row cells
      if (startIndex + index < cells.length) {
        const val = cells[startIndex + index];
        row[date] = parseNumber(val);
      } else {
        row[date] = 0;
      }
    });

    data.push(row);
  }

  return { data, dates };
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(val);
};

export interface LiveQuoteData {
  commodity?: string;
  ticker?: string;
  price: number;
  high: number;
  low: number;
  prevClose: number;
  change?: number;
  changePercent?: number;
  currency?: string;
}

export const formatPriceLevel = (val: number, isCurrencyPair = false): string => {
  if (isCurrencyPair || val < 5) {
    return val.toFixed(4);
  }
  if (val >= 1000) {
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return val.toFixed(2);
};

export const generateLocalFallbackAnalysis = (
  commodity: string | null,
  summaryRow?: SummaryRow | null,
  _historyPoints?: { date: string; value: number }[],
  liveQuote?: LiveQuoteData | null
): string => {
  const isAsset = !!commodity && !!summaryRow;
  const netPos = summaryRow ? summaryRow["Net Positions"] : 0;
  const netChange = summaryRow ? summaryRow["Net Change"] : 0;
  const isBullish = netChange > 0;
  const isStrongBull = isBullish && netPos > 0;
  const isStrongBear = !isBullish && netPos < 0;
  const sentimentLabel = isStrongBull ? "Bullish" : isStrongBear ? "Bearish" : (isBullish ? "Mildly Bullish" : "Mildly Bearish");

  let keyLevelsObj: any = {
    support: "Institutional demand zone / Previous session low",
    resistance: "Institutional supply zone / Previous session high",
    pivot_point: "Weekly volume-weighted pivot"
  };

  if (liveQuote && liveQuote.price > 0) {
    const isFx = commodity?.includes("Euro") || commodity?.includes("Pound") || commodity?.includes("Yen") || commodity?.includes("Dollar") || commodity?.includes("Franc");
    const pPrice = liveQuote.price;
    const pHigh = liveQuote.high || pPrice * 1.008;
    const pLow = liveQuote.low || pPrice * 0.992;
    const pClose = liveQuote.prevClose || pPrice;
    const pivot = (pHigh + pLow + pClose) / 3;
    const r1 = (2 * pivot) - pLow;
    const s1 = (2 * pivot) - pHigh;
    const r2 = pivot + (pHigh - pLow);
    const s2 = pivot - (pHigh - pLow);
    const invalidation = isBullish ? s2 * 0.996 : r2 * 1.004;

    keyLevelsObj = {
      current_price: `$${formatPriceLevel(pPrice, isFx)}`,
      resistance: `$${formatPriceLevel(r1, isFx)} - Tactical Resistance (R1 / Liquidity Sweep)`,
      resistance_2: `$${formatPriceLevel(r2, isFx)} - Major Structural Supply Zone (R2)`,
      pivot_point: `$${formatPriceLevel(pivot, isFx)} - Central Weekly Equilibrium (PP)`,
      support: `$${formatPriceLevel(s1, isFx)} - Institutional Demand Zone (S1 / Order Block)`,
      support_2: `$${formatPriceLevel(s2, isFx)} - Deep Discount Liquidity Pool (S2)`,
      invalidation_level: `$${formatPriceLevel(invalidation, isFx)} - Daily close beyond invalidates COT bias`
    };
  }

  const pAsset = `Structural Market Thesis: Smart Money vs. Retail Dynamics\n\nThe Commitment of Traders (COT) data reveals a highly distinct positioning structure for ${commodity}. Institutional participants and commercial hedgers are currently heavily skewed ${netPos >= 0 ? 'NET LONG' : 'NET SHORT'}, holding ${Math.abs(netPos).toLocaleString()} net contracts. The most recent reporting period saw an aggressive ${isBullish ? 'accumulation' : 'distribution'} phase of ${Math.abs(netChange).toLocaleString()} contracts, indicating that the 'Smart Money' is actively front-running anticipated macroeconomic shifts.\n\nWhen we contextualize this directional flow against the broader geopolitical landscape and recent central bank rhetoric, we see a clear institutional conviction. Retail traders are likely caught offsides, fading this structural trend. This divergence creates a highly asymmetric daily timeframe opportunity. The institutional footprint is undeniable: they are absorbing liquidity at discount levels and building massive inventory for a sustained ${isBullish ? 'bullish markup' : 'bearish markdown'} phase.`;

  const pMacro = `Macro Structural Thesis: Cross-Asset Institutional Flows\n\nThe aggregate Commitment of Traders (COT) data reveals massive rotational capital flows across global asset classes. We are witnessing a clear divergence where 'Smart Money' is aggressively reallocating capital in response to shifting central bank liquidity cycles and geopolitical friction.\n\nMetals, currencies, and energy are completely decoupling. The institutional footprint shows distinct accumulation in specific safe-haven or high-yield assets, while actively liquidating exposure in highly levered risk-on sectors. This is not a retail-driven market; this is a pure, systematic institutional rotation. Understanding these hidden flows provides a massive edge for daily timeframe positioning, allowing us to align with the deepest pockets in the market.`;

  const aAsset = `Tactical 'If I Were You' Playbook (Daily Timeframe):\n\n1. Directional Bias: Strictly ${isBullish ? 'LONG (Buy the dips)' : 'SHORT (Sell the rallies)'} based on the massive institutional ${isBullish ? 'accumulation' : 'distribution'}. Do not counter-trend trade this asset.\n2. Entry Condition (The Setup): Wait patiently for the daily price action to sweep retail liquidity at the tactical ${isBullish ? 'Support (S1)' : 'Resistance (R1)'} zone. Do not enter randomly; let the price come to the calculated institutional equilibrium.\n3. Execution Trigger: We need a clear DAILY CLOSE that rejects the ${isBullish ? 'S1/S2 discount zones' : 'R1/R2 premium zones'}. A strong rejection candle (pin bar or engulfing) confirms the Smart Money is defending their average entry price.\n4. Risk Management: Hard stop-loss placed exactly below the Structural Invalidation Level. If the daily candle closes beyond this line, our institutional thesis is broken and we exit immediately.\n5. Profit Targets: Scale out 50% of the position at the first major liquidity pool (R1 for longs, S1 for shorts), and hold the runner towards the extreme R2/S2 targets.`;

  const aMacro = `Tactical Macro Playbook:\n\n1. Asset Selection: Isolate the 2 or 3 specific commodities/currencies showing the most aggressive week-over-week Net Change in institutional positioning. Ignore the rest.\n2. Execution Framing: Wait for major macroeconomic data releases (e.g., NFP, CPI) to create artificial 'whipsaws'. Use these engineered liquidity sweeps to enter in the direction of the dominant COT trend.\n3. Risk Management: Never trade the initial news spike. Wait for the New York session daily close to confirm the true institutional intent before committing capital.`;

  const data = {
    sentiment: {
      label: sentimentLabel,
      reason: isAsset
        ? `Institutional positioning changed by ${netChange > 0 ? '+' : ''}${netChange.toLocaleString()} contracts to reach a net position of ${netPos.toLocaleString()} contracts.`
        : "Macro institutional flows show distinct positioning shifts across major asset sectors."
    },
    perspective: isAsset ? pAsset : pMacro,
    actionable_advice: isAsset ? aAsset : aMacro,
    key_levels: keyLevelsObj,
    institutional_bias: isAsset
      ? `${isBullish ? 'Accumulation' : 'Distribution'} (Weekly shift: ${netChange > 0 ? '+' : ''}${netChange.toLocaleString()} contracts)`
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

  return JSON.stringify(data, null, 2);
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
