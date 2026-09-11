
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

  // Calculate realistic key price levels if live price is provided
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

    // Classic Pivot Points formula
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

  const data = {
    sentiment: {
      label: sentimentLabel,
      reason: isAsset
        ? `Institutional positioning changed by ${netChange > 0 ? '+' : ''}${netChange.toLocaleString()} contracts to reach a net position of ${netPos.toLocaleString()} contracts.`
        : "Macro institutional flows show distinct positioning shifts across major asset sectors."
    },
    perspective: isAsset
      ? `Institutional traders are ${netPos >= 0 ? 'net long' : 'net short'} on ${commodity}. The latest weekly move indicates active ${isBullish ? 'accumulation' : 'distribution'} by commercial and institutional participants.`
      : "Market structure reveals directional divergence between metals, currencies, and energy contracts.",
    actionable_advice: isAsset
      ? `Align order flow with the institutional bias (${sentimentLabel}). Watch for price pullbacks into key support/resistance zones before executing, and maintain strict risk management.`
      : "Focus on assets with the highest institutional net changes, and wait for session liquidity confirmation.",
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
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
