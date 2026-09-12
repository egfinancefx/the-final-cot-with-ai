async function run() {
    const res = await fetch("https://query2.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d", {
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    const data = await res.json();
    const meta = data.chart.result[0].meta;
    console.log("Price:", meta.regularMarketPrice);
}
run();
