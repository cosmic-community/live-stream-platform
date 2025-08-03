'use client';

import { useState, useEffect, useRef } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  createPeerConnection,
  getPeerConnectionState,
  checkWebRTCSupport
} from '@/lib/webrtc';
import {
  initializeSocket,
  joinAsViewer,
  sendAnswer,
  sendIceCandidate,
  setupViewerListeners,
  leaveStream,
  disconnectSocket,
  isSocketConnected,
  getSocket
} from '@/lib/socket';
import { ConnectionState, PeerConnectionState } from '@/types';
import StreamStatus from '@/components/StreamStatus';
import ErrorAlert from '@/components/ErrorAlert';

const STREAM_ID = 'main-stream'; // Fixed stream ID for simplicity

export default function WatchPage() {
  // State management
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isStreaming: false,
    viewerCount: 0,
    connectionStatus: 'disconnected',
  });
  
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isReceivingVideo, setIsReceivingVideo] = useState(false);
  const [error, setError] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Refs for WebRTC components
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  
  // Initialize WebRTC support check
  useEffect(() => {
    const support = checkWebRTCSupport();
    if (!support.supported) {
      setError(`WebRTC not supported. Missing: ${support.missing.join(', ')}`);
    }
  }, []);
  
  // Initialize Socket.IO connection and join as viewer
  useEffect(() => {
    const socket = initializeSocket();
    setIsConnecting(true);
    
    const updateConnectionStatus = () => {
      const connected = isSocketConnected();
      setConnectionState(prev => ({
        ...prev,
        isConnected: connected,
        connectionStatus: connected ? 'connected' : 'disconnected',
      }));
      
      if (connected) {
        // Join as viewer when connected - no arguments needed
        joinAsViewer();
      }
    };
    
    socket.on('connect', () => {
      updateConnectionStatus();
      setIsConnecting(false);
    });
    
    socket.on('disconnect', () => {
      updateConnectionStatus();
      setIsConnecting(false);
      setIsStreamActive(false);
      setIsReceivingVideo(false);
    });
    
    // Setup viewer-specific listeners
    setupViewerListeners(
      handleOffer,
      handleIceCandidate,
      handleStreamEnd,
      handleStreamStatus,
      handleError
    );
    
    updateConnectionStatus();
    
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      leaveStream();
      disconnectSocket();
    };
  }, []);
  
  // Handle WebRTC offer from broadcaster - Updated function signature to match expected type
  const handleOffer = async (data: { offer: RTCSessionDescriptionInit; broadcasterId: string; }) => {
    try {
      setError('');
      console.log('Received offer from broadcaster:', data.broadcasterId);
      
      const { offer } = data;
      
      // Create peer connection if not exists
      if (!peerConnectionRef.current) {
        peerConnectionRef.current = createPeerConnection();
        
        // Handle ICE candidates
        peerConnectionRef.current.addEventListener('icecandidate', (event) => {
          if (event.candidate) {
            sendIceCandidate(event.candidate.toJSON(), STREAM_ID);
          }
        });
        
        // Handle remote stream
        peerConnectionRef.current.addEventListener('track', (event) => {
          console.log('Received remote track:', event.track.kind);
          const [remoteStream] = event.streams;
          if (remoteStream) {
            remoteStreamRef.current = remoteStream;
            
            if (videoRef.current) {
              videoRef.current.srcObject = remoteStream;
              setIsReceivingVideo(true);
            }
          }
        });
        
        // Handle connection state changes
        peerConnectionRef.current.addEventListener('connectionstatechange', () => {
          const peerConnection = peerConnectionRef.current;
          if (peerConnection) {
            const state = getPeerConnectionState(peerConnection);
            console.log('Connection state changed:', state.connectionState);
            
            if (state.connectionState === 'connected') {
              setConnectionState(prev => ({
                ...prev,
                connectionStatus: 'connected',
              }));
            } else if (state.connectionState === 'failed' || state.connectionState === 'disconnected') {
              setConnectionState(prev => ({
                ...prev,
                connectionStatus: 'disconnected',
              }));
              setIsReceivingVideo(false);
            }
          }
        });
      }
      
      // Set remote description and create answer
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      // Send answer back to broadcaster - Fixed to use only 2 parameters
      sendAnswer(answer, STREAM_ID);
      
      setIsStreamActive(true);
      
    } catch (error) {
      console.error('Error handling offer:', error);
      setError('Failed to connect to stream');
    }
  };
  
  // Handle ICE candidate from broadcaster - Fixed function signature to match expected type
  const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit; fromId: string; }) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log('Added ICE candidate from broadcaster:', data.fromId);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };
  
  // Handle stream end from broadcaster
  const handleStreamEnd = () => {
    console.log('Stream ended by broadcaster');
    setIsStreamActive(false);
    setIsReceivingVideo(false);
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    remoteStreamRef.current = null;
  };
  
  // Handle stream status updates - Fixed function signature to match expected type
  const handleStreamStatus = (data: { broadcasterId: string; }) => {
    console.log('Stream status update from broadcaster:', data.broadcasterId);
    // Extract the actual stream status - assuming active if we receive the message
    const isActive = true;
    setIsStreamActive(isActive);
    
    if (!isActive) {
      setIsReceivingVideo(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };
  
  // Handle Socket.IO errors
  const handleError = (message: string) => {
    setError(message);
  };
  
  // Retry connection
  const retryConnection = () => {
    setError('');
    setIsConnecting(true);
    
    // Reinitialize connection
    setTimeout(() => {
      if (isSocketConnected()) {
        joinAsViewer();
      }
      setIsConnecting(false);
    }, 1000);
  };
  
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Watch Live Stream
            </h1>
            <p className="text-gray-400">
              Real-time video streaming from broadcasters
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
            action={
              <button
                onClick={retryConnection}
                className="btn-primary text-sm ml-4"
                disabled={isConnecting}
              >
                {isConnecting ? 'Retrying...' : 'Retry'}
              </button>
            }
          />
        )}
        
        {/* Status */}
        <div className="mb-8">
          <StreamStatus 
            connectionState={{
              ...connectionState,
              isStreaming: isStreamActive,
            }}
            mediaState={{
              hasCamera: isReceivingVideo,
              hasScreen: isReceivingVideo,
              isAudioEnabled: isReceivingVideo,
              isVideoEnabled: isReceivingVideo,
            }}
            isViewer={true}
          />
        </div>
        
        {/* Video Player */}
        <div className="glass-effect p-6 rounded-lg mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Live Stream</h2>
            <div className="flex items-center space-x-4">
              {isStreamActive && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-400 font-medium">LIVE</span>
                </div>
              )}
              {isReceivingVideo && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-400">Connected</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="video-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              controls
              className="w-full h-full object-cover rounded-lg"
            />
            
            {/* Overlay Messages */}
            {!connectionState.isConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 rounded-lg">
                <div className="text-center">
                  <div className="text-4xl mb-2">🔌</div>
                  <p className="text-gray-300 mb-4">
                    {isConnecting ? 'Connecting to server...' : 'Disconnected from server'}
                  </p>
                  {!isConnecting && (
                    <button
                      onClick={retryConnection}
                      className="btn-primary"
                    >
                      Reconnect
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {connectionState.isConnected && !isStreamActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 rounded-lg">
                <div className="text-center">
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="text-gray-300 mb-2">Waiting for broadcaster...</p>
                  <p className="text-sm text-gray-400">
                    The stream will start automatically when available
                  </p>
                </div>
              </div>
            )}
            
            {isStreamActive && !isReceivingVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 rounded-lg">
                <div className="text-center">
                  <div className="text-4xl mb-2">📡</div>
                  <p className="text-gray-300 mb-2">Connecting to stream...</p>
                  <div className="flex justify-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Connection Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-effect p-4 rounded-lg">
            <h3 className="font-semibold text-white mb-3">Connection Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Server:</span>
                <span className={connectionState.isConnected ? 'text-green-400' : 'text-red-400'}>
                  {connectionState.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Stream:</span>
                <span className={isStreamActive ? 'text-green-400' : 'text-yellow-400'}>
                  {isStreamActive ? 'Active' : 'Waiting'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Video:</span>
                <span className={isReceivingVideo ? 'text-green-400' : 'text-gray-400'}>
                  {isReceivingVideo ? 'Receiving' : 'No signal'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="glass-effect p-4 rounded-lg">
            <h3 className="font-semibold text-white mb-3">Stream Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Stream ID:</span>
                <span className="text-white font-mono">{STREAM_ID}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Quality:</span>
                <span className="text-white">Auto (WebRTC)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Latency:</span>
                <span className="text-white">~100ms</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="glass-effect p-4 rounded-lg mt-6">
          <h3 className="font-semibold text-white mb-3">Viewing Tips</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Video will automatically start when broadcaster begins streaming</li>
            <li>• Use video controls to adjust volume and enter fullscreen</li>
            <li>• If connection is lost, the page will attempt to reconnect automatically</li>
            <li>• For best quality, ensure stable internet connection</li>
          </ul>
        </div>
      </div>
    </div>
  );
}