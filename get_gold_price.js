async function run() {
    const res = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1mo", {
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    const data = await res.json();
    console.log(JSON.stringify(data.chart.result[0].meta, null, 2));
}
run();
