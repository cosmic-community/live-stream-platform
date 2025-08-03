'use client';

import { useState, useEffect } from 'react';
import { 
  initializeSocket, 
  disconnectSocket, 
  isSocketConnected 
} from '@/lib/socket';

interface SocketToggleProps {
  onConnectionChange: (connected: boolean) => void;
}

export default function SocketToggle({ onConnectionChange }: SocketToggleProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check initial connection status
    const connected = isSocketConnected();
    setIsConnected(connected);
    onConnectionChange(connected);
  }, [onConnectionChange]);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      const socket = initializeSocket();
      
      // Wait for connection to establish
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000); // 10 second timeout

        socket.on('connect', () => {
          clearTimeout(timeout);
          setIsConnected(true);
          setIsConnecting(false);
          onConnectionChange(true);
          resolve(true);
        });

        socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          setIsConnecting(false);
          reject(error);
        });

        // If already connected, resolve immediately
        if (socket.connected) {
          clearTimeout(timeout);
          setIsConnected(true);
          setIsConnecting(false);
          onConnectionChange(true);
          resolve(true);
        }
      });
    } catch (error) {
      console.error('Failed to connect socket:', error);
      setIsConnecting(false);
      setIsConnected(false);
      onConnectionChange(false);
    }
  };

  const handleDisconnect = () => {
    disconnectSocket();
    setIsConnected(false);
    setIsConnecting(false);
    onConnectionChange(false);
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

        {/* Connection Toggle Button */}
        <div className="pt-2">
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="btn-success w-full flex items-center justify-center space-x-2 py-2"
            >
              <span className="text-lg">🔌</span>
              <span>{isConnecting ? 'Connecting...' : 'Connect Socket'}</span>
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="btn-danger w-full flex items-center justify-center space-x-2 py-2"
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
                <p>• Click "Connect Socket" to establish connection</p>
              </>
            ) : (
              <>
                <p>• Socket connection established</p>
                <p>• Ready to start streaming</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}