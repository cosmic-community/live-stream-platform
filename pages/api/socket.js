import { Server } from 'socket.io';

/**
 * Socket.IO signaling server for WebRTC live streaming
 * Handles offer/answer/ice-candidate relay between broadcasters and viewers
 */
export default function SocketHandler(req, res) {
  // Initialize Socket.IO server if not already done
  if (!res.socket.server.io) {
    console.log('🚀 Initializing Socket.IO signaling server...');
    
    // Create Socket.IO server with custom path and CORS settings
    const io = new Server(res.socket.server, {
      path: '/api/socket_io',
      addTrailingSlash: false,
      cors: {
        origin: '*', // Open CORS - tighten this in production
        methods: ['GET', 'POST'],
      },
    });
    
    // Store active connections and their roles
    const connections = new Map();
    
    // Handle new client connections
    io.on('connection', (socket) => {
      console.log('📱 Client connected:', socket.id);
      
      // Store connection info
      connections.set(socket.id, {
        id: socket.id,
        role: null, // 'broadcaster' or 'viewer'
        streamId: null,
      });
      
      /**
       * Handle broadcaster events
       */
      
      // Broadcaster starts streaming
      socket.on('start-broadcast', (data) => {
        console.log('🎥 Broadcaster started:', socket.id);
        
        // Update connection role
        const connection = connections.get(socket.id);
        if (connection) {
          connection.role = 'broadcaster';
          connection.streamId = data.streamId || 'default';
        }
        
        // Join broadcaster to their own room
        socket.join('broadcasters');
        
        // Notify all viewers that a stream is available
        socket.broadcast.emit('stream-available', {
          broadcasterId: socket.id,
          streamId: connection?.streamId,
        });
      });
      
      // Broadcaster stops streaming
      socket.on('stop-broadcast', () => {
        console.log('🛑 Broadcaster stopped:', socket.id);
        
        // Notify all viewers that stream ended
        socket.broadcast.emit('stream-ended', {
          broadcasterId: socket.id,
        });
        
        // Leave broadcaster room
        socket.leave('broadcasters');
        
        // Update connection role
        const connection = connections.get(socket.id);
        if (connection) {
          connection.role = null;
          connection.streamId = null;
        }
      });
      
      /**
       * Handle viewer events
       */
      
      // Viewer joins to watch
      socket.on('join-as-viewer', () => {
        console.log('👀 Viewer joined:', socket.id);
        
        // Update connection role
        const connection = connections.get(socket.id);
        if (connection) {
          connection.role = 'viewer';
        }
        
        // Join viewers room
        socket.join('viewers');
        
        // Check if there's an active broadcaster
        const activeBroadcaster = Array.from(connections.values())
          .find(conn => conn.role === 'broadcaster');
        
        if (activeBroadcaster) {
          // Notify viewer about available stream
          socket.emit('stream-available', {
            broadcasterId: activeBroadcaster.id,
            streamId: activeBroadcaster.streamId,
          });
        }
      });
      
      /**
       * WebRTC Signaling Events
       * These relay the offer/answer/ice-candidate messages between peers
       */
      
      // Relay WebRTC offer from broadcaster to all viewers
      socket.on('offer', (offer) => {
        console.log('📤 Relaying offer from broadcaster:', socket.id);
        
        // Broadcast offer to all connected viewers
        socket.broadcast.emit('offer', {
          offer,
          broadcasterId: socket.id,
        });
      });
      
      // Relay WebRTC answer from viewer to broadcaster
      socket.on('answer', (data) => {
        console.log('📥 Relaying answer from viewer:', socket.id, 'to broadcaster:', data.broadcasterId);
        
        // Send answer to specific broadcaster
        socket.to(data.broadcasterId).emit('answer', {
          answer: data.answer,
          viewerId: socket.id,
        });
      });
      
      // Relay ICE candidates between peers
      socket.on('ice-candidate', (data) => {
        console.log('🧊 Relaying ICE candidate from:', socket.id);
        
        // Relay ICE candidate to the target peer
        if (data.targetId) {
          socket.to(data.targetId).emit('ice-candidate', {
            candidate: data.candidate,
            fromId: socket.id,
          });
        } else {
          // Broadcast to all if no specific target
          socket.broadcast.emit('ice-candidate', {
            candidate: data.candidate,
            fromId: socket.id,
          });
        }
      });
      
      /**
       * Handle client disconnection
       */
      socket.on('disconnect', (reason) => {
        console.log('📴 Client disconnected:', socket.id, 'Reason:', reason);
        
        const connection = connections.get(socket.id);
        
        // If broadcaster disconnected, notify all viewers
        if (connection?.role === 'broadcaster') {
          socket.broadcast.emit('stream-ended', {
            broadcasterId: socket.id,
          });
        }
        
        // Clean up connection data
        connections.delete(socket.id);
      });
    });
    
    // Attach the Socket.IO server to the Next.js server
    res.socket.server.io = io;
    console.log('✅ Socket.IO signaling server initialized');
  } else {
    console.log('♻️ Socket.IO server already running');
  }
  
  res.end();
}

// Disable body parsing for this API route
export const config = {
  api: {
    bodyParser: false,
  },
};