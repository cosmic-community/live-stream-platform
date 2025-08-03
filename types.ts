export interface ConnectionState {
  isConnected: boolean;
  isStreaming: boolean;
  viewerCount: number;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
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
  iceGatheringState: RTCIceGatheringState;
  signalingState: RTCSignalingState;
}

export interface WebRTCSupport {
  supported: boolean;
  missing: string[];
}

export interface StreamConfig {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
}

export interface SocketEvents {
  // Broadcaster events
  'join-broadcaster': (streamId: string) => void;
  'offer': (offer: RTCSessionDescriptionInit, streamId: string) => void;
  'ice-candidate-broadcaster': (candidate: RTCIceCandidateInit, streamId: string) => void;
  'end-stream': (streamId: string) => void;
  
  // Viewer events
  'join-viewer': (streamId: string) => void;
  'answer': (answer: RTCSessionDescriptionInit, streamId: string, viewerId: string) => void;
  'ice-candidate-viewer': (candidate: RTCIceCandidateInit, streamId: string) => void;
  'leave-viewer': (streamId: string) => void;
  
  // General events
  'viewer-count': (count: number) => void;
  'stream-status': (isActive: boolean) => void;
  'error': (message: string) => void;
}