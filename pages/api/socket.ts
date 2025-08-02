import { NextApiRequest } from 'next';
import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  InterServerEvents, 
  SocketData,
  SignalingData 
} from '@/types';

// Simplified NextApiResponse interface for Socket.IO
interface NextApiResponseWithSocket {
  socket: {
    server: NetServer & {
      io?: SocketIOServer<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
      >;
    };
  };
  end: () => void;
}

// Store active streams and viewer counts
const activeStreams = new Map<string, {
  broadcasterId: string;
  viewers: Set<string>;
  isActive: boolean;
}>();

export default function SocketHandler(
  req: NextApiRequest, 
  res: NextApiResponseWithSocket
) {
  // Initialize Socket.IO server if not already done
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...');
    
    const io = new SocketIOServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? false // Set to your production domain
          : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });
    
    // Handle client connections
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // Handle broadcaster starting a stream
      socket.on('start-stream', (streamId: string) => {
        console.log(`Broadcaster ${socket.id} starting stream: ${streamId}`);
        
        // Mark socket as broadcaster
        socket.data.streamId = streamId;
        socket.data.isBroadcaster = true;
        
        // Initialize or update stream info
        if (!activeStreams.has(streamId)) {
          activeStreams.set(streamId, {
            broadcasterId: socket.id,
            viewers: new Set(),
            isActive: true,
          });
        } else {
          const stream = activeStreams.get(streamId)!;
          stream.broadcasterId = socket.id;
          stream.isActive = true;
        }
        
        // Join broadcaster to stream room
        socket.join(streamId);
        
        // Notify existing viewers that stream is active
        socket.to(streamId).emit('stream-status', true);
        
        console.log(`Stream ${streamId} is now active with broadcaster ${socket.id}`);
      });
      
      // Handle viewer joining a stream
      socket.on('join-stream', (streamId: string) => {
        console.log(`Viewer ${socket.id} joining stream: ${streamId}`);
        
        // Mark socket as viewer
        socket.data.streamId = streamId;
        socket.data.viewerId = socket.id;
        socket.data.isBroadcaster = false;
        
        // Join viewer to stream room
        socket.join(streamId);
        
        // Add viewer to stream
        if (activeStreams.has(streamId)) {
          const stream = activeStreams.get(streamId)!;
          stream.viewers.add(socket.id);
          
          // Notify broadcaster about viewer count
          io.to(stream.broadcasterId).emit('viewer-count', stream.viewers.size);
          
          // If stream is active, notify viewer
          if (stream.isActive) {
            socket.emit('stream-status', true);
          }
        } else {
          // Stream doesn't exist yet, notify viewer
          socket.emit('stream-status', false);
        }
        
        console.log(`Viewer ${socket.id} joined stream ${streamId}`);
      });
      
      // Handle viewer leaving a stream
      socket.on('leave-stream', (streamId: string) => {
        console.log(`Client ${socket.id} leaving stream: ${streamId}`);
        
        socket.leave(streamId);
        
        if (activeStreams.has(streamId)) {
          const stream = activeStreams.get(streamId)!;
          stream.viewers.delete(socket.id);
          
          // Notify broadcaster about updated viewer count
          io.to(stream.broadcasterId).emit('viewer-count', stream.viewers.size);
        }
      });
      
      // Handle WebRTC offer from broadcaster
      socket.on('offer', (data: SignalingData) => {
        console.log(`Offer from broadcaster ${socket.id} for stream: ${data.streamId}`);
        
        if (data.streamId && activeStreams.has(data.streamId)) {
          const stream = activeStreams.get(data.streamId)!;
          
          // Forward offer to all viewers in the stream
          socket.to(data.streamId).emit('offer', data);
          
          console.log(`Forwarded offer to ${stream.viewers.size} viewers`);
        }
      });
      
      // Handle WebRTC answer from viewer
      socket.on('answer', (data: SignalingData) => {
        console.log(`Answer from viewer ${socket.id} for stream: ${data.streamId}`);
        
        if (data.streamId && activeStreams.has(data.streamId)) {
          const stream = activeStreams.get(data.streamId)!;
          
          // Forward answer to broadcaster
          io.to(stream.broadcasterId).emit('answer', {
            ...data,
            viewerId: socket.id,
          });
          
          console.log(`Forwarded answer to broadcaster ${stream.broadcasterId}`);
        }
      });
      
      // Handle ICE candidates
      socket.on('ice-candidate', (data: SignalingData) => {
        console.log(`ICE candidate from ${socket.id} for stream: ${data.streamId}`);
        
        if (data.streamId && activeStreams.has(data.streamId)) {
          const stream = activeStreams.get(data.streamId)!;
          
          if (socket.data.isBroadcaster) {
            // Forward ICE candidate from broadcaster to all viewers
            socket.to(data.streamId).emit('ice-candidate', data);
          } else {
            // Forward ICE candidate from viewer to broadcaster
            io.to(stream.broadcasterId).emit('ice-candidate', {
              ...data,
              viewerId: socket.id,
            });
          }
        }
      });
      
      // Handle stream ending
      socket.on('end-stream', (streamId: string) => {
        console.log(`Stream ${streamId} ended by broadcaster ${socket.id}`);
        
        if (activeStreams.has(streamId)) {
          const stream = activeStreams.get(streamId)!;
          stream.isActive = false;
          
          // Notify all viewers that stream has ended
          socket.to(streamId).emit('end-stream');
          socket.to(streamId).emit('stream-status', false);
          
          // Clean up stream data
          activeStreams.delete(streamId);
          
          console.log(`Cleaned up stream ${streamId}`);
        }
      });
      
      // Handle client disconnection
      socket.on('disconnect', (reason) => {
        console.log(`Client ${socket.id} disconnected:`, reason);
        
        const streamId = socket.data.streamId;
        if (streamId && activeStreams.has(streamId)) {
          const stream = activeStreams.get(streamId)!;
          
          if (socket.data.isBroadcaster) {
            // Broadcaster disconnected - end stream
            console.log(`Broadcaster disconnected, ending stream ${streamId}`);
            stream.isActive = false;
            
            // Notify all viewers
            socket.to(streamId).emit('end-stream');
            socket.to(streamId).emit('stream-status', false);
            
            // Clean up stream
            activeStreams.delete(streamId);
          } else {
            // Viewer disconnected - remove from viewer list
            stream.viewers.delete(socket.id);
            
            // Notify broadcaster about updated viewer count
            io.to(stream.broadcasterId).emit('viewer-count', stream.viewers.size);
            
            console.log(`Viewer removed, ${stream.viewers.size} viewers remaining`);
          }
        }
      });
    });
    
    res.socket.server.io = io;
    console.log('Socket.IO server initialized');
  } else {
    console.log('Socket.IO server already running');
  }
  
  res.end();
}

// Configuration for Next.js API route
export const config = {
  api: {
    bodyParser: false,
  },
};