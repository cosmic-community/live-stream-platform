import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

/**
 * Broadcaster Page
 * Allows users to start camera/screen sharing and broadcast live streams
 */
export default function BroadcastPage() {
  // State management
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamType, setStreamType] = useState(null); // 'camera' or 'screen'
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Refs for DOM elements and WebRTC objects
  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // Map of viewer ID to RTCPeerConnection
  
  // WebRTC configuration with STUN server
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
    ],
  };
  
  /**
   * Initialize Socket.IO connection on component mount
   */
  useEffect(() => {
    initializeSocket();
    
    return () => {
      // Cleanup on component unmount
      cleanup();
    };
  }, []);
  
  /**
   * Initialize Socket.IO connection and setup event listeners
   */
  const initializeSocket = async () => {
    try {
      // Wake up the socket server
      await fetch('/api/socket');
      
      // Connect to Socket.IO server
      socketRef.current = io({
        path: '/api/socket_io',
      });
      
      // Socket connection events
      socketRef.current.on('connect', () => {
        console.log('🔌 Connected to signaling server');
        setSocketConnected(true);
        setError(null);
      });
      
      socketRef.current.on('disconnect', () => {
        console.log('📴 Disconnected from signaling server');
        setSocketConnected(false);
      });
      
      // Handle viewer answers
      socketRef.current.on('answer', async (data) => {
        console.log('📥 Received answer from viewer:', data.viewerId);
        
        const peerConnection = peerConnectionsRef.current.get(data.viewerId);
        if (peerConnection && data.answer) {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      });
      
      // Handle ICE candidates from viewers
      socketRef.current.on('ice-candidate', async (data) => {
        console.log('🧊 Received ICE candidate from viewer:', data.fromId);
        
        const peerConnection = peerConnectionsRef.current.get(data.fromId);
        if (peerConnection && data.candidate) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });
      
      // Track viewer count (this would need additional server logic)
      socketRef.current.on('viewer-joined', () => {
        setViewerCount(prev => prev + 1);
      });
      
      socketRef.current.on('viewer-left', () => {
        setViewerCount(prev => Math.max(0, prev - 1));
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize socket:', error);
      setError('Failed to connect to signaling server');
    }
  };
  
  /**
   * Create RTCPeerConnection for a new viewer
   */
  const createPeerConnection = (viewerId) => {
    const peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          targetId: viewerId,
        });
      }
    };
    
    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`🔗 Connection state with ${viewerId}:`, peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed') {
        // Clean up disconnected peer connection
        peerConnectionsRef.current.delete(viewerId);
        setViewerCount(prev => Math.max(0, prev - 1));
      }
    };
    
    return peerConnection;
  };
  
  /**
   * Start camera stream
   */
  const startCamera = async () => {
    try {
      setError(null);
      
      // Get user media (camera + microphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      // Set local stream and display in video element
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Start broadcasting
      await startBroadcast('camera');
      
    } catch (error) {
      console.error('❌ Error accessing camera:', error);
      setError('Failed to access camera. Please check permissions.');
    }
  };
  
  /**
   * Start screen share
   */
  const startScreenShare = async () => {
    try {
      setError(null);
      
      // Get display media (screen share)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      
      // Set local stream and display in video element
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Handle screen share ending (user clicks "Stop Sharing")
      stream.getVideoTracks()[0].onended = () => {
        stopStream();
      };
      
      // Start broadcasting
      await startBroadcast('screen');
      
    } catch (error) {
      console.error('❌ Error accessing screen:', error);
      setError('Failed to access screen. Please check permissions.');
    }
  };
  
  /**
   * Start broadcasting the stream
   */
  const startBroadcast = async (type) => {
    if (!socketRef.current || !localStreamRef.current) {
      setError('Socket or stream not available');
      return;
    }
    
    try {
      // Update state
      setIsStreaming(true);
      setStreamType(type);
      
      // Notify server that we're starting to broadcast
      socketRef.current.emit('start-broadcast', {
        streamId: 'default',
        streamType: type,
      });
      
      // Set up listener for when viewers join
      socketRef.current.on('viewer-requesting-stream', async (data) => {
        await handleNewViewer(data.viewerId);
      });
      
      console.log('🎥 Broadcasting started:', type);
      
    } catch (error) {
      console.error('❌ Error starting broadcast:', error);
      setError('Failed to start broadcast');
      stopStream();
    }
  };
  
  /**
   * Handle new viewer joining the stream
   */
  const handleNewViewer = async (viewerId) => {
    try {
      // Create peer connection for this viewer
      const peerConnection = createPeerConnection(viewerId);
      peerConnectionsRef.current.set(viewerId, peerConnection);
      
      // Create and send offer to viewer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // Send offer through signaling server
      socketRef.current.emit('offer', offer);
      
      console.log('📤 Sent offer to viewer:', viewerId);
      
    } catch (error) {
      console.error('❌ Error handling new viewer:', error);
    }
  };
  
  /**
   * Stop streaming
   */
  const stopStream = () => {
    try {
      // Stop all tracks in the local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        localStreamRef.current = null;
      }
      
      // Clear local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      
      // Close all peer connections
      peerConnectionsRef.current.forEach(peerConnection => {
        peerConnection.close();
      });
      peerConnectionsRef.current.clear();
      
      // Notify server that broadcast stopped
      if (socketRef.current) {
        socketRef.current.emit('stop-broadcast');
      }
      
      // Update state
      setIsStreaming(false);
      setStreamType(null);
      setViewerCount(0);
      setError(null);
      
      console.log('🛑 Streaming stopped');
      
    } catch (error) {
      console.error('❌ Error stopping stream:', error);
    }
  };
  
  /**
   * Cleanup function
   */
  const cleanup = () => {
    stopStream();
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🎥 Live Stream Broadcaster</h1>
          <p className="text-gray-300">
            Share your camera or screen with viewers in real-time
          </p>
        </div>
        
        {/* Connection Status */}
        <div className="mb-6 text-center">
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${
            socketConnected ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'
          }`}>
            <div className={`w-3 h-3 rounded-full mr-2 ${
              socketConnected ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            {socketConnected ? 'Connected to Server' : 'Disconnected'}
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-800 border border-red-600 text-red-200 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {/* Control Buttons */}
        {!isStreaming ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={startCamera}
              disabled={!socketConnected}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              📹 Start Camera
            </button>
            <button
              onClick={startScreenShare}
              disabled={!socketConnected}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              🖥️ Start Screen Share
            </button>
          </div>
        ) : (
          <div className="flex justify-center mb-8">
            <button
              onClick={stopStream}
              className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              ⏹️ Stop Stream
            </button>
          </div>
        )}
        
        {/* Stream Info */}
        {isStreaming && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center bg-red-600 px-4 py-2 rounded-full mb-4">
              <div className="w-3 h-3 bg-red-300 rounded-full mr-2 animate-pulse"></div>
              LIVE - {streamType === 'camera' ? 'Camera' : 'Screen Share'}
            </div>
            <p className="text-gray-300">
              👥 Viewers: {viewerCount}
            </p>
          </div>
        )}
        
        {/* Local Video Preview */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!isStreaming && (
              <div className="flex items-center justify-center h-full bg-gray-800">
                <div className="text-center">
                  <div className="text-6xl mb-4">📹</div>
                  <p className="text-gray-400">Your stream preview will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Instructions */}
        <div className="mt-8 max-w-2xl mx-auto text-center text-gray-300">
          <h3 className="text-xl font-semibold mb-4">Instructions</h3>
          <ul className="text-left space-y-2">
            <li>• Click "Start Camera" to broadcast your webcam</li>
            <li>• Click "Start Screen Share" to broadcast your screen</li>
            <li>• Share this page's URL with viewers: <code className="bg-gray-800 px-2 py-1 rounded">/watch</code></li>
            <li>• Click "Stop Stream" when you're done broadcasting</li>
          </ul>
        </div>
      </div>
    </div>
  );
}