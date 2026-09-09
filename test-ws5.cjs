const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000/live');

ws.on('open', () => {
    ws.send(JSON.stringify({ type: 'setup', data: 'test', userName: 'test', botPersona: 'test' }));
});

ws.on('message', (msg) => {
    const data = JSON.parse(msg.toString());
    
    if (data.ready) {
        console.log("Ready, sending text msg...");
        ws.send(JSON.stringify({ text: "مرحبا، هل تسمعني؟" }));
    } else if (data.debug) {
        console.log("DEBUG MSG:", JSON.stringify(data.debug, null, 2));
    } else {
        console.log('Received keys:', Object.keys(data));
    }
});

setTimeout(() => {
    process.exit(0);
}, 10000);
