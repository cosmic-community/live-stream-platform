'use client';

import { useState, useEffect, useRef } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  createPeerConnection, 
  getCameraStream, 
  getScreenStream, 
  addStreamToPeerConnection,
  stopMediaStream,
  getMediaState,
  getPeerConnectionState,
  checkWebRTCSupport
} from '@/lib/webrtc';
import { 
  initializeSocket,
  joinAsBroadcaster,
  sendOffer,
  sendIceCandidate,
  setupBroadcasterListeners,
  endStream,
  disconnectSocket,
  isSocketConnected
} from '@/lib/socket';
import { ConnectionState, MediaState, PeerConnectionState } from '@/types';
import StreamStatus from '@/components/StreamStatus';
import MediaControls from '@/components/MediaControls';
import ViewerStats from '@/components/ViewerStats';
import ErrorAlert from '@/components/ErrorAlert';

const STREAM_ID = 'main-stream'; // Fixed stream ID for simplicity

export default function BroadcastPage() {
  // State management
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isStreaming: false,
    viewerCount: 0,
    connectionStatus: 'disconnected',
  });
  
  const [mediaState, setMediaState] = useState<MediaState>({
    hasCamera: false,
    hasScreen: false,
    isAudioEnabled: false,
    isVideoEnabled: false,
  });
  
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for WebRTC components
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const viewerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  
  // Initialize WebRTC support check
  useEffect(() => {
    const support = checkWebRTCSupport();
    if (!support.supported) {
      setError(`WebRTC not supported. Missing: ${support.missing.join(', ')}`);
    }
  }, []);
  
  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = initializeSocket();
    
    const updateConnectionStatus = () => {
      setConnectionState(prev => ({
        ...prev,
        isConnected: isSocketConnected(),
        connectionStatus: isSocketConnected() ? 'connected' : 'disconnected',
      }));
    };
    
    socket.on('connect', updateConnectionStatus);
    socket.on('disconnect', updateConnectionStatus);
    
    // Setup broadcaster-specific listeners
    setupBroadcasterListeners(
      handleAnswer,
      handleIceCandidate,
      handleViewerCountUpdate,
      handleError
    );
    
    updateConnectionStatus();
    
    return () => {
      disconnectSocket();
    };
  }, []);
  
  // Handle WebRTC answer from viewer
  const handleAnswer = async (answer: RTCSessionDescriptionInit, viewerId: string) => {
    try {
      const viewerConnection = viewerConnectionsRef.current.get(viewerId);
      if (viewerConnection) {
        await viewerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('Set remote description for viewer:', viewerId);
      }
    } catch (error) {
      console.error('Error handling answer:', error);
      setError('Failed to process viewer connection');
    }
  };
  
  // Handle ICE candidate from viewer
  const handleIceCandidate = async (candidate: RTCIceCandidateInit, viewerId: string) => {
    try {
      const viewerConnection = viewerConnectionsRef.current.get(viewerId);
      if (viewerConnection) {
        await viewerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('Added ICE candidate for viewer:', viewerId);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };
  
  // Handle viewer count updates
  const handleViewerCountUpdate = (count: number) => {
    setConnectionState(prev => ({
      ...prev,
      viewerCount: count,
    }));
  };
  
  // Handle Socket.IO errors
  const handleError = (message: string) => {
    setError(message);
  };
  
  // Start camera streaming
  const startCamera = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Stop existing stream
      if (localStreamRef.current) {
        stopMediaStream(localStreamRef.current);
      }
      
      // Get camera stream
      const stream = await getCameraStream();
      localStreamRef.current = stream;
      
      // Display local video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Setup WebRTC for viewers
      await setupWebRTCForViewers(stream);
      
      // Update state
      const newMediaState = getMediaState(stream);
      setMediaState(newMediaState);
      setConnectionState(prev => ({
        ...prev,
        isStreaming: true,
      }));
      
    } catch (error) {
      console.error('Error starting camera:', error);
      setError(error instanceof Error ? error.message : 'Failed to start camera');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start screen sharing
  const startScreenShare = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Stop existing stream
      if (localStreamRef.current) {
        stopMediaStream(localStreamRef.current);
      }
      
      // Get screen stream
      const stream = await getScreenStream();
      localStreamRef.current = stream;
      
      // Handle screen share end (user clicks browser stop button)
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          console.log('Screen share ended by user');
          stopStreaming();
        });
      }
      
      // Display local video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Setup WebRTC for viewers
      await setupWebRTCForViewers(stream);
      
      // Update state
      const newMediaState = getMediaState(stream);
      setMediaState(newMediaState);
      setConnectionState(prev => ({
        ...prev,
        isStreaming: true,
      }));
      
    } catch (error) {
      console.error('Error starting screen share:', error);
      setError(error instanceof Error ? error.message : 'Failed to start screen sharing');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Setup WebRTC peer connections for viewers
  const setupWebRTCForViewers = async (stream: MediaStream) => {
    // Create main peer connection for signaling
    if (!peerConnectionRef.current) {
      peerConnectionRef.current = createPeerConnection();
      
      // Handle ICE candidates
      peerConnectionRef.current.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
          sendIceCandidate(event.candidate.toJSON(), STREAM_ID);
        }
      });
    }
    
    // Add stream to peer connection
    addStreamToPeerConnection(peerConnectionRef.current, stream);
    
    // Join as broadcaster
    joinAsBroadcaster(STREAM_ID);
    
    // Create and send offer
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    sendOffer(offer, STREAM_ID);
  };
  
  // Stop streaming
  const stopStreaming = () => {
    setIsLoading(true);
    
    try {
      // Stop local stream
      if (localStreamRef.current) {
        stopMediaStream(localStreamRef.current);
        localStreamRef.current = null;
      }
      
      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      // Close peer connections
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      // Close viewer connections
      viewerConnectionsRef.current.forEach(connection => {
        connection.close();
      });
      viewerConnectionsRef.current.clear();
      
      // End stream via Socket.IO
      endStream(STREAM_ID);
      
      // Update state
      setMediaState({
        hasCamera: false,
        hasScreen: false,
        isAudioEnabled: false,
        isVideoEnabled: false,
      });
      
      setConnectionState(prev => ({
        ...prev,
        isStreaming: false,
        viewerCount: 0,
      }));
      
      setError('');
      
    } catch (error) {
      console.error('Error stopping stream:', error);
      setError('Error stopping stream');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Broadcasting Dashboard
            </h1>
            <p className="text-gray-400">
              Share your camera or screen with viewers worldwide
            </p>
          </div>
          <Link
            href="/"
            className="btn-primary"
          >
            ← Back to Home
          </Link>
        </div>
        
        {/* Error Alert */}
        {error && (
          <ErrorAlert 
            message={error} 
            onClose={() => setError('')} 
          />
        )}
        
        {/* Status Row */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <StreamStatus 
            connectionState={connectionState}
            mediaState={mediaState}
          />
          <ViewerStats 
            viewerCount={connectionState.viewerCount}
            isStreaming={connectionState.isStreaming}
          />
          <div className="glass-effect p-4 rounded-lg">
            <h3 className="font-semibold text-white mb-2">Stream URL</h3>
            <div className="text-sm text-gray-300 break-all">
              {typeof window !== 'undefined' && (
                <code className="bg-gray-800 px-2 py-1 rounded">
                  {window.location.origin}/watch
                </code>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Preview */}
          <div className="lg:col-span-2">
            <div className="glass-effect p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">
                Stream Preview
              </h2>
              <div className="video-container">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                />
                {!connectionState.isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📹</div>
                      <p className="text-gray-300">
                        Click "Start Camera" or "Start Screen Share" to begin
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="space-y-6">
            <MediaControls
              mediaState={mediaState}
              isStreaming={connectionState.isStreaming}
              isLoading={isLoading}
              onStartCamera={startCamera}
              onStartScreenShare={startScreenShare}
              onStopStreaming={stopStreaming}
            />
            
            {/* Connection Info */}
            <div className="glass-effect p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-3">Connection Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Socket Status:</span>
                  <span className={connectionState.isConnected ? 'text-green-400' : 'text-red-400'}>
                    {connectionState.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Stream Status:</span>
                  <span className={connectionState.isStreaming ? 'text-green-400' : 'text-gray-400'}>
                    {connectionState.isStreaming ? 'Broadcasting' : 'Idle'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Viewers:</span>
                  <span className="text-white font-medium">
                    {connectionState.viewerCount}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Instructions */}
            <div className="glass-effect p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-3">How to Stream</h3>
              <ol className="text-sm text-gray-300 space-y-2">
                <li>1. Click "Start Camera" or "Start Screen Share"</li>
                <li>2. Allow browser permissions when prompted</li>
                <li>3. Share the watch URL with your viewers</li>
                <li>4. Monitor viewer count and connection status</li>
                <li>5. Click "End Stream" when finished</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}