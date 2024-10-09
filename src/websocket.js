// src/websocket.js

const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ noServer: true });
let clients = [];

// WebSocket server connection event
wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.push(ws);

  // Handle client disconnection
  ws.on('close', () => {
    clients = clients.filter(client => client !== ws);
    console.log('Client disconnected');
  });
});

// Function to broadcast data to all connected clients
const broadcast = (data) => {
  clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

module.exports = { wss, broadcast };
