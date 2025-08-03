'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  initializeSocket, 
  disconnectSocket, 
  isSocketConnected,
  getSocket,
  getConnectionInfo
} from '@/lib/socket';

interface SocketToggleProps {
  onConnectionChange: (connected: boolean) => void;
}

export default function SocketToggle({ onConnectionChange }: SocketToggleProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<{
    connected: boolean;
    id: string | null;
    transport: string | null;
  }>({ connected: false, id: null, transport: null });

  const updateConnectionStatus = useCallback(() => {
    const connected = isSocketConnected();
    const info = getConnectionInfo();
    
    setIsConnected(connected);
    setConnectionInfo(info);
    onConnectionChange(connected);
    
    if (connected) {
      setError(null);
    }
  }, [onConnectionChange]);

  useEffect(() => {
    // Check initial connection status
    updateConnectionStatus();
    
    // Set up periodic status checks
    const statusInterval = setInterval(updateConnectionStatus, 1000);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, [updateConnectionStatus]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      console.log('🔄 Attempting to connect to Socket.IO server...');
      const socket = initializeSocket();
      
      // Wait for connection to establish
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout after 15 seconds - server may be unavailable'));
        }, 15000); // 15 second timeout

        const onConnect = () => {
          console.log('✅ Socket connected successfully');
          clearTimeout(timeout);
          socket.off('connect', onConnect);
          socket.off('connect_error', onConnectError);
          updateConnectionStatus();
          setIsConnecting(false);
          resolve();
        };

        const onConnectError = (error: Error) => {
          console.error('❌ Socket connection failed:', error);
          clearTimeout(timeout);
          socket.off('connect', onConnect);
          socket.off('connect_error', onConnectError);
          setIsConnecting(false);
          
          let errorMessage = 'Connection failed';
          if (error.message.includes('xhr poll error')) {
            errorMessage = 'Server connection failed - check if development server is running';
          } else if (error.message.includes('timeout')) {
            errorMessage = 'Connection timeout - server may be busy or unavailable';
          } else if (error.message.includes('ECONNREFUSED')) {
            errorMessage = 'Connection refused - server is not running on this port';
          } else {
            errorMessage = `Connection failed: ${error.message}`;
          }
          
          reject(new Error(errorMessage));
        };

        socket.on('connect', onConnect);
        socket.on('connect_error', onConnectError);

        // If already connected, resolve immediately
        if (socket.connected) {
          clearTimeout(timeout);
          socket.off('connect', onConnect);
          socket.off('connect_error', onConnectError);
          updateConnectionStatus();
          setIsConnecting(false);
          resolve();
        }
      });
    } catch (error) {
      console.error('🚨 Failed to connect socket:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      setError(errorMessage);
      setIsConnecting(false);
      updateConnectionStatus();
    }
  };

  const handleDisconnect = () => {
    console.log('🔌 Disconnecting socket...');
    disconnectSocket();
    updateConnectionStatus();
    setIsConnecting(false);
    setError(null);
  };

  return (
    <div className="glass-effect p-4 rounded-lg">
      <h3 className="font-semibold text-white mb-3">Socket Connection</h3>
      
      <div className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Status:</span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected 
                ? 'bg-green-500 animate-pulse' 
                : isConnecting 
                  ? 'bg-yellow-500 animate-pulse' 
                  : 'bg-red-500'
            }`}></div>
            <span className={`text-sm font-medium ${
              isConnected 
                ? 'text-green-400' 
                : isConnecting 
                  ? 'text-yellow-400' 
                  : 'text-red-400'
            }`}>
              {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Socket ID */}
        {isConnected && connectionInfo.id && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Socket ID:</span>
            <span className="text-xs text-blue-400 font-mono">
              {connectionInfo.id}
            </span>
          </div>
        )}

        {/* Transport */}
        {isConnected && connectionInfo.transport && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Transport:</span>
            <span className="text-xs text-green-400 font-mono capitalize">
              {connectionInfo.transport}
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm font-medium">⚠️ Error</p>
            <p className="text-red-300 text-xs mt-1">{error}</p>
            <div className="mt-2 text-xs text-gray-400">
              <p>💡 Troubleshooting tips:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Ensure the Next.js development server is running</li>
                <li>Check the browser console for additional errors</li>
                <li>Try refreshing the page</li>
                <li>Verify the Socket.IO server endpoint is accessible</li>
              </ul>
            </div>
          </div>
        )}

        {/* Connection Toggle Button */}
        <div className="pt-2">
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="btn-success w-full flex items-center justify-center space-x-2 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              <span className="text-lg">🔌</span>
              <span>{isConnecting ? 'Connecting...' : 'Connect Socket'}</span>
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="btn-danger w-full flex items-center justify-center space-x-2 py-2 transition-colors"
            >
              <span className="text-lg">🔌</span>
              <span>Disconnect Socket</span>
            </button>
          )}
        </div>

        {/* Connection Info */}
        <div className="pt-2 border-t border-gray-700">
          <div className="text-xs text-gray-400 space-y-1">
            {!isConnected ? (
              <>
                <p>• Socket must be connected to start streaming</p>
                <p>• Server endpoint: <code className="text-blue-400">/api/socketio</code></p>
                <p>• Click "Connect Socket" to establish connection</p>
                <p>• Make sure your development server is running</p>
              </>
            ) : (
              <>
                <p>• ✅ Socket connection established</p>
                <p>• 🚀 Ready to start streaming</p>
                <p>• 🔄 Using {connectionInfo.transport || 'WebSocket'} transport</p>
                <p>• 🆔 Connected as: {connectionInfo.id}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}