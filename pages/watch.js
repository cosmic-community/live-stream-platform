import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

/**
 * Viewer Page
 * Allows users to watch live streams from broadcasters
 */
export default function WatchPage() {
  // State management
  const [isWatching, setIsWatching] = useState(false);
  const [streamAvailable, setStreamAvailable] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [broadcasterId, setBroadcasterId] = useState(null);
  
  // Refs for DOM elements and WebRTC objects
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  
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
        
        // Join as viewer
        socketRef.current.emit('join-as-viewer');
      });
      
      socketRef.current.on('disconnect', () => {
        console.log('📴 Disconnected from signaling server');
        setSocketConnected(false);
        setStreamAvailable(false);
        setIsWatching(false);
      });
      
      // Handle stream availability
      socketRef.current.on('stream-available', (data) => {
        console.log('📺 Stream available from broadcaster:', data.broadcasterId);
        setStreamAvailable(true);
        setBroadcasterId(data.broadcasterId);
        setError(null);
      });
      
      socketRef.current.on('stream-ended', (data) => {
        console.log('📴 Stream ended from broadcaster:', data.broadcasterId);
        setStreamAvailable(false);
        setIsWatching(false);
        setBroadcasterId(null);
        cleanup();
      });
      
      // Handle WebRTC offer from broadcaster
      socketRef.current.on('offer', async (data) => {
        console.log('📥 Received offer from broadcaster:', data.broadcasterId);
        
        if (data.offer && data.broadcasterId) {
          setBroadcasterId(data.broadcasterId);
          await handleOffer(data.offer, data.broadcasterId);
        }
      });
      
      // Handle ICE candidates from broadcaster
      socketRef.current.on('ice-candidate', async (data) => {
        console.log('🧊 Received ICE candidate from broadcaster:', data.fromId);
        
        if (peerConnectionRef.current && data.candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize socket:', error);
      setError('Failed to connect to signaling server');
    }
  };
  
  /**
   * Create RTCPeerConnection for receiving stream
   */
  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Handle incoming remote stream
    peerConnection.ontrack = (event) => {
      console.log('📺 Received remote stream');
      
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsWatching(true);
      }
    };
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && broadcasterId) {
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          targetId: broadcasterId,
        });
      }
    };
    
    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log('🔗 Connection state:', state);
      setConnectionState(state);
      
      if (state === 'connected') {
        setError(null);
      } else if (state === 'failed' || state === 'disconnected') {
        setError('Connection to broadcaster lost');
        setIsWatching(false);
      }
    };
    
    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      const state = peerConnection.iceConnectionState;
      console.log('🧊 ICE connection state:', state);
      
      if (state === 'failed') {
        setError('Failed to establish connection with broadcaster');
      }
    };
    
    return peerConnection;
  };
  
  /**
   * Handle WebRTC offer from broadcaster
   */
  const handleOffer = async (offer, broadcasterId) => {
    try {
      // Create peer connection if it doesn't exist
      if (!peerConnectionRef.current) {
        peerConnectionRef.current = createPeerConnection();
      }
      
      // Set remote description (broadcaster's offer)
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Create answer
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      // Send answer back to broadcaster
      socketRef.current.emit('answer', {
        answer,
        broadcasterId,
      });
      
      console.log('📤 Sent answer to broadcaster:', broadcasterId);
      
    } catch (error) {
      console.error('❌ Error handling offer:', error);
      setError('Failed to connect to stream');
    }
  };
  
  /**
   * Start watching the stream
   */
  const startWatching = () => {
    if (!streamAvailable || !socketRef.current) {
      setError('No stream available');
      return;
    }
    
    // Request stream from broadcaster
    socketRef.current.emit('viewer-requesting-stream', {
      viewerId: socketRef.current.id,
    });
    
    console.log('👀 Requested stream from broadcaster');
  };
  
  /**
   * Stop watching the stream
   */
  const stopWatching = () => {
    setIsWatching(false);
    
    // Clear remote video
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setConnectionState('disconnected');
    console.log('👋 Stopped watching stream');
  };
  
  /**
   * Cleanup function
   */
  const cleanup = () => {
    stopWatching();
    
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
          <h1 className="text-4xl font-bold mb-4">📺 Live Stream Viewer</h1>
          <p className="text-gray-300">
            Watch live streams from broadcasters in real-time
          </p>
        </div>
        
        {/* Connection Status */}
        <div className="mb-6 text-center">
          <div className={`inline-flex items-center px-4 py-2 rounded-full mr-4 ${
            socketConnected ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'
          }`}>
            <div className={`w-3 h-3 rounded-full mr-2 ${
              socketConnected ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            {socketConnected ? 'Connected to Server' : 'Disconnected'}
          </div>
          
          {socketConnected && (
            <div className={`inline-flex items-center px-4 py-2 rounded-full ${
              streamAvailable ? 'bg-blue-800 text-blue-200' : 'bg-gray-800 text-gray-200'
            }`}>
              <div className={`w-3 h-3 rounded-full mr-2 ${
                streamAvailable ? 'bg-blue-400' : 'bg-gray-400'
              }`}></div>
              {streamAvailable ? 'Stream Available' : 'No Stream Available'}
            </div>
          )}
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-800 border border-red-600 text-red-200 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {/* Control Buttons */}
        <div className="flex justify-center mb-8">
          {!isWatching ? (
            <button
              onClick={startWatching}
              disabled={!socketConnected || !streamAvailable}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              {streamAvailable ? '📺 Start Watching' : '⏳ Waiting for Stream...'}
            </button>
          ) : (
            <button
              onClick={stopWatching}
              className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              ⏹️ Stop Watching
            </button>
          )}
        </div>
        
        {/* Connection State Info */}
        {isWatching && (
          <div className="text-center mb-6">
            <div className={`inline-flex items-center px-4 py-2 rounded-full ${
              connectionState === 'connected' ? 'bg-green-800 text-green-200' :
              connectionState === 'connecting' ? 'bg-yellow-800 text-yellow-200' :
              'bg-red-800 text-red-200'
            }`}>
              <div className={`w-3 h-3 rounded-full mr-2 ${
                connectionState === 'connected' ? 'bg-green-400' :
                connectionState === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                'bg-red-400'
              }`}></div>
              {connectionState === 'connected' ? 'Streaming' :
               connectionState === 'connecting' ? 'Connecting...' :
               'Disconnected'}
            </div>
          </div>
        )}
        
        {/* Remote Video Display */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!isWatching && (
              <div className="flex items-center justify-center h-full bg-gray-800">
                <div className="text-center">
                  <div className="text-6xl mb-4">📺</div>
                  <p className="text-gray-400">
                    {streamAvailable 
                      ? 'Click "Start Watching" to view the live stream'
                      : 'Waiting for a broadcaster to start streaming...'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Instructions */}
        <div className="mt-8 max-w-2xl mx-auto text-center text-gray-300">
          <h3 className="text-xl font-semibold mb-4">Instructions</h3>
          <ul className="text-left space-y-2">
            <li>• Wait for a broadcaster to start streaming</li>
            <li>• Click "Start Watching" when a stream becomes available</li>
            <li>• The stream will automatically connect via WebRTC</li>
            <li>• Click "Stop Watching" to disconnect from the stream</li>
            <li>• Visit <code className="bg-gray-800 px-2 py-1 rounded">/broadcast</code> to start your own stream</li>
          </ul>
        </div>
      </div>
    </div>
  );
}