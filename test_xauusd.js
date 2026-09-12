async function run() {
    try {
        const res = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/XAUUSD=X?interval=1d&range=1mo", {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        const data = await res.json();
        if(data.chart.result) {
            console.log("XAUUSD=X exists! Price:", data.chart.result[0].meta.regularMarketPrice);
        } else {
            console.log("XAUUSD=X not found or error:", data);
        }
    } catch (e) { console.log(e.message); }
}
run();
