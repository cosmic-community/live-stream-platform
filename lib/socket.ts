import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Initialize Socket.IO connection
 */
export function initializeSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }
  
  // Disconnect existing socket if it exists but isn't connected
  if (socket && !socket.connected) {
    socket.disconnect();
    socket = null;
  }
  
  // Connect to the Socket.IO server running on /api/socketio
  const serverUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  socket = io(serverUrl, {
    path: '/api/socketio',
    transports: ['websocket', 'polling'],
    upgrade: true,
    rememberUpgrade: true,
    forceNew: false,
    timeout: 20000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    autoConnect: true,
  });
  
  socket.on('connect', () => {
    console.log('✅ Socket.IO connected:', socket?.id);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('❌ Socket.IO disconnected:', reason);
  });
  
  socket.on('connect_error', (error) => {
    console.error('🚨 Socket.IO connection error:', error.message);
    console.error('Error details:', error);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 Socket.IO reconnected after', attemptNumber, 'attempts');
  });

  socket.on('reconnect_error', (error) => {
    console.error('🚨 Socket.IO reconnection failed:', error.message);
  });

  socket.on('reconnect_failed', () => {
    console.error('💥 Socket.IO reconnection failed completely');
  });
  
  return socket;
}

/**
 * Get current socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected || false;
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket.IO disconnected');
  }
}

// Broadcaster functions
export function startBroadcast(streamId: string): void {
  if (!socket?.connected) {
    console.error('Cannot start broadcast: Socket not connected');
    return;
  }
  socket.emit('start-broadcast', { streamId });
  console.log('🎥 Started broadcast for stream:', streamId);
}

export function joinAsBroadcaster(streamId: string): void {
  if (!socket?.connected) {
    console.error('Cannot join as broadcaster: Socket not connected');
    return;
  }
  socket.emit('join-as-broadcaster', { streamId });
  console.log('🎥 Joined as broadcaster for stream:', streamId);
}

export function stopBroadcast(): void {
  if (!socket?.connected) {
    console.error('Cannot stop broadcast: Socket not connected');
    return;
  }
  socket.emit('stop-broadcast');
  console.log('🛑 Stopped broadcast');
}

export function endStream(): void {
  if (!socket?.connected) {
    console.error('Cannot end stream: Socket not connected');
    return;
  }
  socket.emit('end-stream');
  console.log('🔚 Ended stream');
}

export function sendOffer(offer: RTCSessionDescriptionInit): void {
  if (!socket?.connected) {
    console.error('Cannot send offer: Socket not connected');
    return;
  }
  socket.emit('offer', offer);
  console.log('📤 Sent WebRTC offer');
}

export function sendIceCandidate(candidate: RTCIceCandidateInit, targetId?: string): void {
  if (!socket?.connected) {
    console.error('Cannot send ICE candidate: Socket not connected');
    return;
  }
  socket.emit('ice-candidate', { candidate, targetId });
  console.log('🧊 Sent ICE candidate', targetId ? `to ${targetId}` : 'broadcast');
}

// Viewer functions
export function joinAsViewer(): void {
  if (!socket?.connected) {
    console.error('Cannot join as viewer: Socket not connected');
    return;
  }
  socket.emit('join-as-viewer');
  console.log('👀 Joined as viewer');
}

export function leaveStream(): void {
  if (!socket?.connected) {
    console.error('Cannot leave stream: Socket not connected');
    return;
  }
  socket.emit('leave-stream');
  console.log('👋 Left stream');
}

export function sendAnswer(answer: RTCSessionDescriptionInit, broadcasterId: string): void {
  if (!socket?.connected) {
    console.error('Cannot send answer: Socket not connected');
    return;
  }
  socket.emit('answer', { answer, broadcasterId });
  console.log('📥 Sent answer to broadcaster:', broadcasterId);
}

// Event listeners setup
export function setupBroadcasterListeners(
  onAnswer: (data: { answer: RTCSessionDescriptionInit; viewerId: string }) => void,
  onIceCandidate: (data: { candidate: RTCIceCandidateInit; fromId: string }) => void,
  onError: (message: string) => void
): void {
  if (!socket) {
    console.error('Cannot setup broadcaster listeners: Socket not initialized');
    return;
  }
  
  socket.on('answer', onAnswer);
  socket.on('ice-candidate', onIceCandidate);
  socket.on('error', (data: { message: string }) => onError(data.message));
  
  console.log('🎥 Broadcaster listeners setup');
}

export function setupViewerListeners(
  onOffer: (data: { offer: RTCSessionDescriptionInit; broadcasterId: string }) => void,
  onIceCandidate: (data: { candidate: RTCIceCandidateInit; fromId: string }) => void,
  onStreamAvailable: (data: { broadcasterId: string; streamId: string }) => void,
  onStreamEnded: (data: { broadcasterId: string }) => void,
  onError: (message: string) => void
): void {
  if (!socket) {
    console.error('Cannot setup viewer listeners: Socket not initialized');
    return;
  }
  
  socket.on('offer', onOffer);
  socket.on('ice-candidate', onIceCandidate);
  socket.on('stream-available', onStreamAvailable);
  socket.on('stream-ended', onStreamEnded);
  socket.on('error', (data: { message: string }) => onError(data.message));
  
  console.log('👀 Viewer listeners setup');
}

// Clean up event listeners
export function removeAllListeners(): void {
  if (socket) {
    socket.removeAllListeners();
    console.log('🧹 Removed all socket listeners');
  }
}

// Get connection status info
export function getConnectionInfo(): {
  connected: boolean;
  id: string | null;
  transport: string | null;
} {
  return {
    connected: socket?.connected || false,
    id: socket?.id || null,
    transport: socket?.io.engine.transport?.name || null,
  };
}