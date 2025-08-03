import { MediaState } from '@/types';

interface MediaControlsProps {
  mediaState: MediaState;
  isStreaming: boolean;
  isLoading: boolean;
  onStartCamera: () => void;
  onStartScreenShare: () => void;
  onStopStreaming: () => void;
}

export default function MediaControls({
  mediaState,
  isStreaming,
  isLoading,
  onStartCamera,
  onStartScreenShare,
  onStopStreaming,
}: MediaControlsProps) {
  return (
    <div className="glass-effect p-6 rounded-lg">
      <h2 className="text-xl font-semibold text-white mb-4">
        Stream Controls
      </h2>
      
      <div className="space-y-4">
        {/* Start Streaming Buttons */}
        {!isStreaming && (
          <>
            <button
              onClick={onStartCamera}
              disabled={isLoading}
              className="btn-success w-full flex items-center justify-center space-x-2 py-3"
            >
              <span className="text-xl">📹</span>
              <span>{isLoading ? 'Starting Camera...' : 'Start Camera'}</span>
            </button>
            
            <button
              onClick={onStartScreenShare}
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center space-x-2 py-3"
            >
              <span className="text-xl">🖥️</span>
              <span>{isLoading ? 'Starting Screen Share...' : 'Start Screen Share'}</span>
            </button>
          </>
        )}
        
        {/* Stop Streaming Button */}
        {isStreaming && (
          <button
            onClick={onStopStreaming}
            disabled={isLoading}
            className="btn-danger w-full flex items-center justify-center space-x-2 py-3"
          >
            <span className="text-xl">⏹️</span>
            <span>{isLoading ? 'Stopping Stream...' : 'End Stream'}</span>
          </button>
        )}
      </div>
      
      {/* Media Status */}
      {isStreaming && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Active Media</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg border ${
              mediaState.hasCamera 
                ? 'border-green-500 bg-green-500 bg-opacity-10' 
                : 'border-gray-600 bg-gray-800'
            }`}>
              <div className="text-center">
                <div className="text-2xl mb-1">📹</div>
                <div className="text-xs text-gray-300">Camera</div>
                <div className={`text-xs mt-1 ${
                  mediaState.hasCamera ? 'text-green-400' : 'text-gray-500'
                }`}>
                  {mediaState.hasCamera ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg border ${
              mediaState.hasScreen 
                ? 'border-green-500 bg-green-500 bg-opacity-10' 
                : 'border-gray-600 bg-gray-800'
            }`}>
              <div className="text-center">
                <div className="text-2xl mb-1">🖥️</div>
                <div className="text-xs text-gray-300">Screen</div>
                <div className={`text-xs mt-1 ${
                  mediaState.hasScreen ? 'text-green-400' : 'text-gray-500'
                }`}>
                  {mediaState.hasScreen ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Audio/Video Status */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className={`p-2 rounded text-center ${
              mediaState.isAudioEnabled 
                ? 'bg-green-500 bg-opacity-20 text-green-400' 
                : 'bg-red-500 bg-opacity-20 text-red-400'
            }`}>
              <div className="text-sm">
                🎤 Audio {mediaState.isAudioEnabled ? 'On' : 'Off'}
              </div>
            </div>
            
            <div className={`p-2 rounded text-center ${
              mediaState.isVideoEnabled 
                ? 'bg-green-500 bg-opacity-20 text-green-400' 
                : 'bg-red-500 bg-opacity-20 text-red-400'
            }`}>
              <div className="text-sm">
                📺 Video {mediaState.isVideoEnabled ? 'On' : 'Off'}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Instructions</h3>
        <ul className="text-xs text-gray-400 space-y-1">
          {!isStreaming ? (
            <>
              <li>• Ensure socket is connected first</li>
              <li>• Choose camera for personal streaming</li>
              <li>• Choose screen share for presentations</li>
              <li>• Allow browser permissions when prompted</li>
            </>
          ) : (
            <>
              <li>• Stream is now live for all viewers</li>
              <li>• Share the watch URL to invite viewers</li>
              <li>• Click "End Stream" to stop broadcasting</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}