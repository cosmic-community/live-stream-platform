import { MediaState, PeerConnectionState, WebRTCSupport, StreamConfig } from '@/types';

// WebRTC configuration
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// Default stream configurations
const DEFAULT_CAMERA_CONFIG: StreamConfig = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

const DEFAULT_SCREEN_CONFIG: StreamConfig = {
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
  },
  audio: true,
};

/**
 * Check WebRTC support in the current browser
 */
export function checkWebRTCSupport(): WebRTCSupport {
  const missing: string[] = [];
  
  if (!window.RTCPeerConnection) {
    missing.push('RTCPeerConnection');
  }
  
  if (!navigator.mediaDevices) {
    missing.push('mediaDevices');
  }
  
  if (!navigator.mediaDevices?.getUserMedia) {
    missing.push('getUserMedia');
  }
  
  if (!navigator.mediaDevices?.getDisplayMedia) {
    missing.push('getDisplayMedia');
  }
  
  return {
    supported: missing.length === 0,
    missing,
  };
}

/**
 * Create a new RTCPeerConnection with ICE servers
 */
export function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection(ICE_SERVERS);
}

/**
 * Get camera stream with default configuration
 */
export async function getCameraStream(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(DEFAULT_CAMERA_CONFIG);
    console.log('Camera stream obtained:', stream.getTracks().map(t => t.kind));
    return stream;
  } catch (error) {
    console.error('Error getting camera stream:', error);
    
    // Try with basic configuration if advanced fails
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log('Fallback camera stream obtained');
      return fallbackStream;
    } catch (fallbackError) {
      throw new Error(`Camera access denied or unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Get screen share stream with default configuration
 */
export async function getScreenStream(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia(DEFAULT_SCREEN_CONFIG);
    console.log('Screen stream obtained:', stream.getTracks().map(t => t.kind));
    return stream;
  } catch (error) {
    console.error('Error getting screen stream:', error);
    throw new Error(`Screen sharing denied or unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Add stream to peer connection
 */
export function addStreamToPeerConnection(peerConnection: RTCPeerConnection, stream: MediaStream): void {
  stream.getTracks().forEach(track => {
    peerConnection.addTrack(track, stream);
    console.log('Added track to peer connection:', track.kind);
  });
}

/**
 * Stop all tracks in a media stream
 */
export function stopMediaStream(stream: MediaStream): void {
  stream.getTracks().forEach(track => {
    track.stop();
    console.log('Stopped track:', track.kind);
  });
}

/**
 * Get current media state from stream
 */
export function getMediaState(stream: MediaStream | null): MediaState {
  if (!stream) {
    return {
      hasCamera: false,
      hasScreen: false,
      isAudioEnabled: false,
      isVideoEnabled: false,
    };
  }
  
  const videoTracks = stream.getVideoTracks();
  const audioTracks = stream.getAudioTracks();
  
  // Determine if it's camera or screen based on track constraints
  const hasScreen = videoTracks.some(track => {
    const settings = track.getSettings();
    return settings.displaySurface !== undefined;
  });
  
  return {
    hasCamera: videoTracks.length > 0 && !hasScreen,
    hasScreen: hasScreen,
    isAudioEnabled: audioTracks.some(track => track.enabled),
    isVideoEnabled: videoTracks.some(track => track.enabled),
  };
}

/**
 * Get peer connection state information
 */
export function getPeerConnectionState(peerConnection: RTCPeerConnection): PeerConnectionState {
  return {
    connectionState: peerConnection.connectionState,
    iceConnectionState: peerConnection.iceConnectionState,
    iceGatheringState: peerConnection.iceGatheringState,
    signalingState: peerConnection.signalingState,
  };
}

/**
 * Toggle audio track enabled state
 */
export function toggleAudio(stream: MediaStream, enabled: boolean): void {
  stream.getAudioTracks().forEach(track => {
    track.enabled = enabled;
  });
}

/**
 * Toggle video track enabled state
 */
export function toggleVideo(stream: MediaStream, enabled: boolean): void {
  stream.getVideoTracks().forEach(track => {
    track.enabled = enabled;
  });
}

/**
 * Get media stream statistics
 */
export async function getStreamStats(peerConnection: RTCPeerConnection): Promise<RTCStatsReport | null> {
  try {
    return await peerConnection.getStats();
  } catch (error) {
    console.error('Error getting stream stats:', error);
    return null;
  }
}

/**
 * Replace video track in peer connection (useful for switching between camera and screen)
 */
export async function replaceVideoTrack(
  peerConnection: RTCPeerConnection,
  newTrack: MediaStreamTrack
): Promise<void> {
  const sender = peerConnection.getSenders().find(s => 
    s.track && s.track.kind === 'video'
  );
  
  if (sender) {
    await sender.replaceTrack(newTrack);
    console.log('Replaced video track');
  } else {
    throw new Error('No video sender found to replace track');
  }
}