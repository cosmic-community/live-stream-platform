export interface StreamConfig {
  video: boolean;
  audio: boolean;
  screen?: boolean;
}

export interface SignalingData {
  type: 'offer' | 'answer' | 'ice-candidate' | 'end-stream';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  streamId?: string;
  viewerId?: string;
}

export interface ConnectionState {
  isConnected: boolean;
  isStreaming: boolean;
  viewerCount: number;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
}

export interface MediaState {
  hasCamera: boolean;
  hasScreen: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

export interface PeerConnectionState {
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  signalingState: RTCSignalingState;
}

export interface StreamingEvent {
  type: 'stream-started' | 'stream-ended' | 'viewer-joined' | 'viewer-left' | 'connection-error';
  data?: any;
  timestamp: number;
}

export interface ViewerInfo {
  id: string;
  joinedAt: number;
  connectionState: RTCPeerConnectionState;
}

// Socket.IO event types for type safety
export interface ServerToClientEvents {
  // Custom application events
  'offer': (data: SignalingData) => void;
  'answer': (data: SignalingData) => void;
  'ice-candidate': (data: SignalingData) => void;
  'end-stream': () => void;
  'viewer-count': (count: number) => void;
  'stream-status': (isActive: boolean) => void;
  'error': (message: string) => void;
  
  // Reserved Socket.IO events for connection management
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'connect_error': (error: Error) => void;
  'reconnect': (attemptNumber: number) => void;
  'reconnect_error': (error: Error) => void;
  'reconnect_failed': () => void;
  'reconnecting': (attemptNumber: number) => void;
}

export interface ClientToServerEvents {
  'join-stream': (streamId: string) => void;
  'leave-stream': (streamId: string) => void;
  'offer': (data: SignalingData) => void;
  'answer': (data: SignalingData) => void;
  'ice-candidate': (data: SignalingData) => void;
  'start-stream': (streamId: string) => void;
  'end-stream': (streamId: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  streamId?: string;
  viewerId?: string;
  isBroadcaster?: boolean;
}