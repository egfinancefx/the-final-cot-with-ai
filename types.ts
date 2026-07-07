
export interface SummaryRow {
  Commodity: string;
  "Net Positions": number;
  "Net Change": number;
  "Long Positions": number;
  "Long Change": number;
  "Short Positions": number;
  "Short Change": number;
}

export interface HistoryRow {
  Commodity: string;
  [date: string]: number | string; // Dynamic date keys
}

export interface ParsedData {
  summary: SummaryRow[];
  history: HistoryRow[];
  historyDates: string[];
}

export type ThemeMode = 'ocean' | 'light';
