
// Google Sheets CSV Export URLs
// Net Positions Sheet
export const SUMMARY_SHEET_URL = "https://docs.google.com/spreadsheets/d/1vERLh_6ywf_buGaMpxdCkF2ES94W9M_a6hLNxobRsuo/export?format=csv";

// Historical Data Sheet
export const HISTORY_SHEET_URL = "https://docs.google.com/spreadsheets/d/1OWvhPM8OG8x1YHc_uxp5UgD9RCsSavVWUiCl22l-e8I/export?format=csv";

export const TV_SYMBOL_MAP: Record<string, string> = {
  "Gold": "OANDA:XAUUSD",
  "Silver": "OANDA:XAGUSD",
  "High Grade Copper": "OANDA:XCUUSD",
  "Platinum": "OANDA:XPTUSD",
  "Palladium": "OANDA:XPDUSD",
  "Crude Oil WTI": "OANDA:WTICOUSD",
  "Natural Gas": "OANDA:NATGASUSD",
  "ULSD NY Harbor": "CAPITALCOM:HEATINGOIL",
  "Gasoline RBOB": "CAPITALCOM:GASOLINE",
  "Euro FX": "OANDA:EURUSD",
  "British Pound": "OANDA:GBPUSD",
  "Japanese Yen": "OANDA:USDJPY",
  "Canadian Dollar": "OANDA:USDCAD",
  "Australian Dollar": "OANDA:AUDUSD",
  "Swiss Franc": "OANDA:USDCHF",
  "New Zealand Dollar": "OANDA:NZDUSD",
  "Mexican Peso": "OANDA:USDMXN",
  "Brazilian Real": "OANDA:USDBRL",
  "South African Rand": "OANDA:USDZAR",
  "U.S. Dollar Index": "CAPITALCOM:DXY",
  "Bitcoin Micro": "BINANCE:BTCUSDT",
  "Ether Micro": "BINANCE:ETHUSDT",
  "Dow Futures Mini": "CME_MINI:YM1!",
  "S&P 500 E-Mini": "CME_MINI:ES1!",
  "Nasdaq 100 E-Mini": "CME_MINI:NQ1!",
  "S&P 500 VIX": "CBOE:VIX",
  "Russell 2000 E-Mini": "CME_MINI:RTY1!",
  "Corn": "CBOT:ZC1!",
  "Soybeans": "CBOT:ZS1!",
  "Soybean Oil": "CBOT:ZL1!",
  "Soybean Meal": "CBOT:ZM1!",
  "Wheat": "CBOT:ZW1!",
  "Live Cattle": "CME:LE1!",
  "Feeder Cattle": "CME:GF1!",
  "Lean Hogs": "CME:HE1!",
  "Cotton #2": "ICEUS:CT1!",
  "Coffee": "TVC:USCOFFEE",
  "Sugar #11": "TVC:USSUGAR",
  "Cocoa": "TVC:USCOCOA",
  "Lumber Physical": "CAPITALCOM:LUMBER",
  "30-Year T-Bond": "TVC:US30Y",
  "Ultra T-Bond": "TVC:US30Y",
  "10-Year T-Note": "TVC:US10Y",
  "Ultra 10-Year T-Note": "TVC:US10Y",
  "5-Year T-Note": "TVC:US05Y",
  "2-Year T-Note": "TVC:US02Y",
  "30-Day Fed Funds": "ECONOMICS:USINTR",
  "3-Month SOFR": "ECONOMICS:USSOFR"
};

export const ASSET_GROUPS = [
  {
    name: "Indices",
    items: ["Dow Futures Mini", "S&P 500 E-Mini", "Nasdaq 100 E-Mini", "S&P 500 VIX", "Russell 2000 E-Mini"]
  },
  {
    name: "Currencies",
    items: ["Euro FX", "British Pound", "Japanese Yen", "Canadian Dollar", "Australian Dollar", "Swiss Franc", "New Zealand Dollar", "Mexican Peso", "Brazilian Real", "South African Rand", "U.S. Dollar Index"]
  },
  {
    name: "Metals",
    items: ["Gold", "Silver", "High Grade Copper", "Platinum", "Palladium"]
  },
  {
    name: "Energy",
    items: ["Crude Oil WTI", "Natural Gas", "ULSD NY Harbor", "Gasoline RBOB"]
  },
  {
    name: "Crypto",
    items: ["Bitcoin Micro", "Ether Micro"]
  }
];
