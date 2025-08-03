import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Initialize Socket.IO connection
 */
export function initializeSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }
  
  // Connect to the Socket.IO server running on /api/socket_io
  const serverUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  socket = io(serverUrl, {
    path: '/api/socket_io',
    transports: ['websocket', 'polling'],
    upgrade: true,
    rememberUpgrade: true,
    forceNew: false,
    timeout: 10000,
  });
  
  socket.on('connect', () => {
    console.log('Socket.IO connected:', socket?.id);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Socket.IO disconnected:', reason);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
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
    console.log('Socket.IO disconnected');
  }
}

// Broadcaster functions
export function startBroadcast(streamId: string): void {
  socket?.emit('start-broadcast', { streamId });
  console.log('Started broadcast for stream:', streamId);
}

export function stopBroadcast(): void {
  socket?.emit('stop-broadcast');
  console.log('Stopped broadcast');
}

export function sendOffer(offer: RTCSessionDescriptionInit): void {
  socket?.emit('offer', offer);
  console.log('Sent WebRTC offer');
}

export function sendIceCandidate(candidate: RTCIceCandidateInit, targetId?: string): void {
  socket?.emit('ice-candidate', { candidate, targetId });
  console.log('Sent ICE candidate', targetId ? `to ${targetId}` : 'broadcast');
}

// Viewer functions
export function joinAsViewer(): void {
  socket?.emit('join-as-viewer');
  console.log('Joined as viewer');
}

export function sendAnswer(answer: RTCSessionDescriptionInit, broadcasterId: string): void {
  socket?.emit('answer', { answer, broadcasterId });
  console.log('Sent answer to broadcaster:', broadcasterId);
}

// Event listeners setup
export function setupBroadcasterListeners(
  onAnswer: (data: { answer: RTCSessionDescriptionInit; viewerId: string }) => void,
  onIceCandidate: (data: { candidate: RTCIceCandidateInit; fromId: string }) => void,
  onError: (message: string) => void
): void {
  if (!socket) return;
  
  socket.on('answer', onAnswer);
  socket.on('ice-candidate', onIceCandidate);
  socket.on('error', onError);
  
  console.log('Broadcaster listeners setup');
}

export function setupViewerListeners(
  onOffer: (data: { offer: RTCSessionDescriptionInit; broadcasterId: string }) => void,
  onIceCandidate: (data: { candidate: RTCIceCandidateInit; fromId: string }) => void,
  onStreamAvailable: (data: { broadcasterId: string; streamId: string }) => void,
  onStreamEnded: (data: { broadcasterId: string }) => void,
  onError: (message: string) => void
): void {
  if (!socket) return;
  
  socket.on('offer', onOffer);
  socket.on('ice-candidate', onIceCandidate);
  socket.on('stream-available', onStreamAvailable);
  socket.on('stream-ended', onStreamEnded);
  socket.on('error', onError);
  
  console.log('Viewer listeners setup');
}

// Clean up event listeners
export function removeAllListeners(): void {
  if (socket) {
    socket.removeAllListeners();
    console.log('Removed all socket listeners');
  }
}