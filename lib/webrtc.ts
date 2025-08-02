import { StreamConfig, MediaState, PeerConnectionState } from '@/types';

// WebRTC configuration with STUN server
export const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

// Media constraints for different streaming modes
export const MEDIA_CONSTRAINTS = {
  camera: {
    video: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 60 },
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  },
  screen: {
    video: {
      width: { ideal: 1920, max: 3840 },
      height: { ideal: 1080, max: 2160 },
      frameRate: { ideal: 30, max: 60 },
    },
    audio: true,
  },
} as const;

/**
 * Creates a new RTCPeerConnection with proper configuration
 */
export function createPeerConnection(): RTCPeerConnection {
  const peerConnection = new RTCPeerConnection(RTC_CONFIGURATION);
  
  // Log connection state changes for debugging
  peerConnection.addEventListener('connectionstatechange', () => {
    console.log('Connection state:', peerConnection.connectionState);
  });
  
  peerConnection.addEventListener('iceconnectionstatechange', () => {
    console.log('ICE connection state:', peerConnection.iceConnectionState);
  });
  
  peerConnection.addEventListener('signalingstatechange', () => {
    console.log('Signaling state:', peerConnection.signalingState);
  });
  
  return peerConnection;
}

/**
 * Requests camera access with optimal settings
 */
export async function getCameraStream(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS.camera);
    console.log('Camera stream acquired:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
    return stream;
  } catch (error) {
    console.error('Error accessing camera:', error);
    throw new Error('Failed to access camera. Please check permissions.');
  }
}

/**
 * Requests screen share access with optimal settings
 */
export async function getScreenStream(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia(MEDIA_CONSTRAINTS.screen);
    console.log('Screen stream acquired:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
    return stream;
  } catch (error) {
    console.error('Error accessing screen:', error);
    throw new Error('Failed to access screen. Please check permissions.');
  }
}

/**
 * Adds media stream tracks to peer connection
 */
export function addStreamToPeerConnection(peerConnection: RTCPeerConnection, stream: MediaStream): void {
  // Remove existing tracks first to avoid conflicts
  const senders = peerConnection.getSenders();
  senders.forEach(sender => {
    if (sender.track) {
      peerConnection.removeTrack(sender);
    }
  });
  
  // Add new tracks
  stream.getTracks().forEach(track => {
    peerConnection.addTrack(track, stream);
    console.log('Added track to peer connection:', track.kind);
  });
}

/**
 * Stops all tracks in a media stream
 */
export function stopMediaStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
      console.log('Stopped track:', track.kind);
    });
  }
}

/**
 * Gets current media state from stream
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
  
  return {
    hasCamera: videoTracks.some(track => track.label.toLowerCase().includes('camera')),
    hasScreen: videoTracks.some(track => track.label.toLowerCase().includes('screen')),
    isAudioEnabled: audioTracks.some(track => track.enabled),
    isVideoEnabled: videoTracks.some(track => track.enabled),
  };
}

/**
 * Gets peer connection state information
 */
export function getPeerConnectionState(peerConnection: RTCPeerConnection): PeerConnectionState {
  return {
    connectionState: peerConnection.connectionState,
    iceConnectionState: peerConnection.iceConnectionState,
    signalingState: peerConnection.signalingState,
  };
}

/**
 * Toggles audio track enabled state
 */
export function toggleAudio(stream: MediaStream | null, enabled: boolean): void {
  if (stream) {
    stream.getAudioTracks().forEach(track => {
      track.enabled = enabled;
    });
  }
}

/**
 * Toggles video track enabled state
 */
export function toggleVideo(stream: MediaStream | null, enabled: boolean): void {
  if (stream) {
    stream.getVideoTracks().forEach(track => {
      track.enabled = enabled;
    });
  }
}

/**
 * Checks if browser supports required WebRTC features
 */
export function checkWebRTCSupport(): { supported: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!navigator.mediaDevices) missing.push('mediaDevices');
  if (!navigator.mediaDevices?.getUserMedia) missing.push('getUserMedia');
  if (!navigator.mediaDevices?.getDisplayMedia) missing.push('getDisplayMedia');
  if (!window.RTCPeerConnection) missing.push('RTCPeerConnection');
  if (!window.RTCSessionDescription) missing.push('RTCSessionDescription');
  if (!window.RTCIceCandidate) missing.push('RTCIceCandidate');
  
  return {
    supported: missing.length === 0,
    missing,
  };
}