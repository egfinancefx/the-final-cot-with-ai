async function run() {
    const res = await fetch("https://query2.finance.yahoo.com/v1/finance/search?q=Gold", {
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    const data = await res.json();
    for (let q of data.quotes) {
        console.log(q.symbol, q.shortname);
    }
}
run();
