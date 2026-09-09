const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000/live');

ws.on('open', () => {
    ws.send(JSON.stringify({ type: 'setup', data: 'test', userName: 'test', botPersona: 'test' }));
});

ws.on('message', (msg) => {
    const data = JSON.parse(msg.toString());
    
    if (data.ready) {
        console.log("Ready!");
    } else if (data.audio) {
        console.log("Received audio! Length:", data.audio.length);
    } else if (data.debug) {
        if (data.debug.toolCall) {
            console.log("Got toolCall!");
        } else if (data.debug.serverContent) {
            console.log("Server Content chunk");
        }
    } else {
        console.log("OTHER:", Object.keys(data));
    }
});

setTimeout(() => process.exit(0), 10000);
