const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000/live');

ws.on('open', () => {
    ws.send(JSON.stringify({ type: 'setup', data: 'test', userName: 'test', botPersona: 'test' }));
});

ws.on('message', (msg) => {
    const data = JSON.parse(msg.toString());
    
    if (data.ready) {
        ws.send(JSON.stringify({ text: "مرحبا" }));
    } else if (data.error) {
        console.log("ERROR RECEIVED:", data.error);
        process.exit(1);
    } else {
        console.log("OTHER:", Object.keys(data));
    }
});
