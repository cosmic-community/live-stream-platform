import { ConnectionState, MediaState } from '@/types';

interface StreamStatusProps {
  connectionState: ConnectionState;
  mediaState: MediaState;
  isViewer?: boolean;
}

export default function StreamStatus({ 
  connectionState, 
  mediaState, 
  isViewer = false 
}: StreamStatusProps) {
  const getConnectionStatusColor = () => {
    switch (connectionState.connectionStatus) {
      case 'connected':
        return 'text-green-400';
      case 'connecting':
      case 'reconnecting':
        return 'text-yellow-400';
      default:
        return 'text-red-400';
    }
  };
  
  const getConnectionStatusText = () => {
    if (isViewer) {
      if (!connectionState.isConnected) return 'Disconnected';
      if (!connectionState.isStreaming) return 'Waiting for stream';
      return 'Watching live';
    }
    
    if (!connectionState.isConnected) return 'Disconnected';
    if (!connectionState.isStreaming) return 'Ready to stream';
    return 'Broadcasting live';
  };
  
  return (
    <div className="glass-effect p-4 rounded-lg">
      <h3 className="font-semibold text-white mb-3">
        {isViewer ? 'Viewer Status' : 'Stream Status'}
      </h3>
      
      <div className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Connection:</span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionState.isConnected ? 'bg-green-500' : 'bg-red-500'
            } ${connectionState.isConnected ? 'animate-pulse' : ''}`}></div>
            <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
              {getConnectionStatusText()}
            </span>
          </div>
        </div>
        
        {/* Media Status for Broadcaster */}
        {!isViewer && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Video:</span>
              <span className={`text-sm ${
                mediaState.isVideoEnabled ? 'text-green-400' : 'text-gray-400'
              }`}>
                {mediaState.hasCamera && 'Camera'}
                {mediaState.hasScreen && 'Screen'}
                {!mediaState.hasCamera && !mediaState.hasScreen && 'Off'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Audio:</span>
              <span className={`text-sm ${
                mediaState.isAudioEnabled ? 'text-green-400' : 'text-gray-400'
              }`}>
                {mediaState.isAudioEnabled ? 'On' : 'Off'}
              </span>
            </div>
          </>
        )}
        
        {/* Stream Quality for Viewer */}
        {isViewer && connectionState.isStreaming && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Quality:</span>
            <span className="text-sm text-green-400">
              {mediaState.hasCamera && 'Camera'}
              {mediaState.hasScreen && 'Screen Share'}
              {!mediaState.hasCamera && !mediaState.hasScreen && 'No Video'}
            </span>
          </div>
        )}
        
        {/* Live Indicator */}
        {connectionState.isStreaming && (
          <div className="flex items-center justify-center pt-2">
            <div className="flex items-center space-x-2 bg-red-500 bg-opacity-20 px-3 py-1 rounded-full border border-red-500 border-opacity-30">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-400 text-xs font-bold uppercase tracking-wide">
                {isViewer ? 'Live' : 'Broadcasting'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}