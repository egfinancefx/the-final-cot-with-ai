async function run() {
    const res = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/XAU=X?interval=1d&range=5d", {
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    const data = await res.json();
    if(data.chart.result) {
        console.log("XAU=X Price:", data.chart.result[0].meta.regularMarketPrice);
    } else {
        console.log("No result for XAU=X");
    }
}
run();
