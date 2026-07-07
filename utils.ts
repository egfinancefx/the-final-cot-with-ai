
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
