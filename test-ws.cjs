const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000/live');
ws.on('open', () => {
    ws.send(JSON.stringify({ type: 'setup', data: 'test', userName: 'test', botPersona: 'test' }));
});
ws.on('message', (msg) => {
    console.log('Received:', msg.toString());
});
ws.on('error', (err) => {
    console.error('Error:', err);
});
ws.on('close', () => {
    console.log('Closed');
});
