async function run() {
    const res = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=5d", {
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    const data = await res.json();
    const meta = data.chart.result[0].meta;
    console.log("Price:", meta.regularMarketPrice);
}
run();
