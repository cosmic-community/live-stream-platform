import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '@/types';

let socket: Socket | null = null;

/**
 * Initialize Socket.IO connection
 */
export function initializeSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }
  
  const serverUrl = process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:3000';
  
  socket = io(serverUrl, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    upgrade: true,
    rememberUpgrade: true,
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
export function joinAsBroadcaster(streamId: string): void {
  socket?.emit('join-broadcaster', streamId);
  console.log('Joined as broadcaster for stream:', streamId);
}

export function sendOffer(offer: RTCSessionDescriptionInit, streamId: string): void {
  socket?.emit('offer', offer, streamId);
  console.log('Sent offer for stream:', streamId);
}

export function sendIceCandidate(candidate: RTCIceCandidateInit, streamId: string): void {
  socket?.emit('ice-candidate-broadcaster', candidate, streamId);
  console.log('Sent ICE candidate for stream:', streamId);
}

export function endStream(streamId: string): void {
  socket?.emit('end-stream', streamId);
  console.log('Ended stream:', streamId);
}

// Viewer functions
export function joinAsViewer(streamId: string): void {
  socket?.emit('join-viewer', streamId);
  console.log('Joined as viewer for stream:', streamId);
}

export function sendAnswer(answer: RTCSessionDescriptionInit, streamId: string, viewerId: string): void {
  socket?.emit('answer', answer, streamId, viewerId);
  console.log('Sent answer for stream:', streamId, 'as viewer:', viewerId);
}

export function sendViewerIceCandidate(candidate: RTCIceCandidateInit, streamId: string): void {
  socket?.emit('ice-candidate-viewer', candidate, streamId);
  console.log('Sent viewer ICE candidate for stream:', streamId);
}

export function leaveStream(streamId: string): void {
  socket?.emit('leave-viewer', streamId);
  console.log('Left stream:', streamId);
}

// Event listeners setup
export function setupBroadcasterListeners(
  onAnswer: (answer: RTCSessionDescriptionInit, viewerId: string) => void,
  onIceCandidate: (candidate: RTCIceCandidateInit, viewerId: string) => void,
  onViewerCount: (count: number) => void,
  onError: (message: string) => void
): void {
  if (!socket) return;
  
  socket.on('answer', onAnswer);
  socket.on('ice-candidate-viewer', onIceCandidate);
  socket.on('viewer-count', onViewerCount);
  socket.on('error', onError);
  
  console.log('Broadcaster listeners setup');
}

export function setupViewerListeners(
  onOffer: (offer: RTCSessionDescriptionInit) => void,
  onIceCandidate: (candidate: RTCIceCandidateInit) => void,
  onStreamEnd: () => void,
  onStreamStatus: (isActive: boolean) => void,
  onError: (message: string) => void
): void {
  if (!socket) return;
  
  socket.on('offer', onOffer);
  socket.on('ice-candidate-broadcaster', onIceCandidate);
  socket.on('stream-end', onStreamEnd);
  socket.on('stream-status', onStreamStatus);
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