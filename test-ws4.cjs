const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000/live');

ws.on('open', () => {
    ws.send(JSON.stringify({ type: 'setup', data: 'test', userName: 'test', botPersona: 'test' }));
});

ws.on('message', (msg) => {
    const data = JSON.parse(msg.toString());
    
    if (data.ready) {
        console.log("Ready, sending dummy audio...");
        const dummyAudio = Buffer.alloc(32000 * 2).toString('base64');
        ws.send(JSON.stringify({ audio: dummyAudio }));
    } else if (data.debug) {
        console.log("DEBUG MSG:", JSON.stringify(data.debug, null, 2));
        if (data.debug.toolCall) {
            console.log("Got toolCall!");
        }
    } else {
        console.log('Received keys:', Object.keys(data));
    }
});

setTimeout(() => {
    console.log("Timeout");
    process.exit(0);
}, 5000);
