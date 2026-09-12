async function run() {
    const res = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1wk&range=1mo", {
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    const data = await res.json();
    const result = data.chart.result[0];
    const quote = result.indicators.quote[0];
    const timestamp = result.timestamp;
    
    // Last week is the previous index before current
    const lastWeekIdx = quote.close.length - 2; 
    
    console.log("Weekly Close:", quote.close[lastWeekIdx]);
    console.log("Weekly High:", quote.high[lastWeekIdx]);
    console.log("Weekly Low:", quote.low[lastWeekIdx]);
    
    console.log("All Closes:", quote.close);
}
run();
