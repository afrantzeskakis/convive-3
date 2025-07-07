import WebSocket from 'ws';
import http from 'http';

// Store the WebSocket server instance
let wss: WebSocket.Server | null = null;

// Store active connections
const clients = new Map();

/**
 * Initialize the WebSocket server
 */
export function initializeWebSocketServer(server: http.Server) {
  wss = new WebSocketServer({ server });
  
  // WebSocket connection handler
  wss.on('connection', (ws) => {
    const id = Date.now();
    console.log(`New WebSocket connection established: ${id}`);
    
    // Store the connection
    clients.set(id, ws);
    
    // Handle connection close
    ws.on('close', () => {
      console.log(`WebSocket connection closed: ${id}`);
      clients.delete(id);
    });
    
    // Handle messages from client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`Received message from client ${id}:`, data);
        
        // Handle different message types if needed
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Send initial connection acknowledgment
    ws.send(JSON.stringify({ 
      type: 'connection', 
      status: 'established', 
      message: 'Connected to wine analysis service' 
    }));
  });
}

/**
 * Broadcast a progress update to all connected clients
 */
export function broadcastProgressUpdate(progress: {
  currentBatch: number;
  totalBatches: number;
  processedWines: number;
  totalWines: number;
  percentComplete: number;
}) {
  if (!wss) {
    console.warn('WebSocket server not initialized. Progress update not sent.');
    return;
  }
  
  const message = JSON.stringify({
    type: 'progress',
    data: progress
  });
  
  clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}