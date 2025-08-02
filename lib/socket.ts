import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@/types';

// Socket.IO client instance
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

/**
 * Initialize Socket.IO connection
 */
export function initializeSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    socket = io({
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
    
    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket.IO connected:', socket?.id);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });
    
    socket.on('reconnect', (attemptNumber: number) => {
      console.log('Socket.IO reconnected after', attemptNumber, 'attempts');
    });
    
    socket.on('reconnect_error', (error: Error) => {
      console.error('Socket.IO reconnection error:', error);
    });
    
    socket.on('reconnect_failed', () => {
      console.error('Socket.IO reconnection failed');
    });
  }
  
  return socket;
}

/**
 * Get current socket instance
 */
export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Join streaming room as broadcaster
 */
export function joinAsBroadcaster(streamId: string): void {
  if (socket) {
    socket.emit('start-stream', streamId);
    console.log('Joined as broadcaster for stream:', streamId);
  }
}

/**
 * Join streaming room as viewer
 */
export function joinAsViewer(streamId: string): void {
  if (socket) {
    socket.emit('join-stream', streamId);
    console.log('Joined as viewer for stream:', streamId);
  }
}

/**
 * Leave streaming room
 */
export function leaveStream(streamId: string): void {
  if (socket) {
    socket.emit('leave-stream', streamId);
    console.log('Left stream:', streamId);
  }
}

/**
 * Send WebRTC offer to viewers
 */
export function sendOffer(offer: RTCSessionDescriptionInit, streamId: string): void {
  if (socket) {
    socket.emit('offer', {
      type: 'offer',
      sdp: offer,
      streamId,
    });
    console.log('Sent offer for stream:', streamId);
  }
}

/**
 * Send WebRTC answer to broadcaster
 */
export function sendAnswer(answer: RTCSessionDescriptionInit, streamId: string, viewerId: string): void {
  if (socket) {
    socket.emit('answer', {
      type: 'answer',
      sdp: answer,
      streamId,
      viewerId,
    });
    console.log('Sent answer for stream:', streamId);
  }
}

/**
 * Send ICE candidate
 */
export function sendIceCandidate(candidate: RTCIceCandidateInit, streamId: string, viewerId?: string): void {
  if (socket) {
    socket.emit('ice-candidate', {
      type: 'ice-candidate',
      candidate,
      streamId,
      viewerId,
    });
    console.log('Sent ICE candidate for stream:', streamId);
  }
}

/**
 * End streaming session
 */
export function endStream(streamId: string): void {
  if (socket) {
    socket.emit('end-stream', streamId);
    console.log('Ended stream:', streamId);
  }
}

/**
 * Setup broadcaster event listeners
 */
export function setupBroadcasterListeners(
  onAnswer: (answer: RTCSessionDescriptionInit, viewerId: string) => void,
  onIceCandidate: (candidate: RTCIceCandidateInit, viewerId: string) => void,
  onViewerCountUpdate: (count: number) => void,
  onError: (message: string) => void
): void {
  if (!socket) return;
  
  socket.on('answer', (data) => {
    if (data.sdp && data.viewerId) {
      onAnswer(data.sdp, data.viewerId);
    }
  });
  
  socket.on('ice-candidate', (data) => {
    if (data.candidate && data.viewerId) {
      onIceCandidate(data.candidate, data.viewerId);
    }
  });
  
  socket.on('viewer-count', onViewerCountUpdate);
  socket.on('error', onError);
}

/**
 * Setup viewer event listeners
 */
export function setupViewerListeners(
  onOffer: (offer: RTCSessionDescriptionInit) => void,
  onIceCandidate: (candidate: RTCIceCandidateInit) => void,
  onStreamEnd: () => void,
  onStreamStatus: (isActive: boolean) => void,
  onError: (message: string) => void
): void {
  if (!socket) return;
  
  socket.on('offer', (data) => {
    if (data.sdp) {
      onOffer(data.sdp);
    }
  });
  
  socket.on('ice-candidate', (data) => {
    if (data.candidate) {
      onIceCandidate(data.candidate);
    }
  });
  
  socket.on('end-stream', onStreamEnd);
  socket.on('stream-status', onStreamStatus);
  socket.on('error', onError);
}

/**
 * Remove all event listeners
 */
export function removeAllListeners(): void {
  if (socket) {
    socket.removeAllListeners();
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}