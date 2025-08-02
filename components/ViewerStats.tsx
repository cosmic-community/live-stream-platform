interface ViewerStatsProps {
  viewerCount: number;
  isStreaming: boolean;
}

export default function ViewerStats({ viewerCount, isStreaming }: ViewerStatsProps) {
  return (
    <div className="glass-effect p-4 rounded-lg">
      <h3 className="font-semibold text-white mb-3">Audience</h3>
      
      <div className="text-center">
        <div className="text-3xl font-bold text-white mb-2">
          {viewerCount}
        </div>
        <div className="text-sm text-gray-400 mb-3">
          {viewerCount === 1 ? 'Viewer' : 'Viewers'} Online
        </div>
        
        {/* Visual Indicator */}
        <div className="flex justify-center mb-3">
          {isStreaming ? (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400 font-medium">
                Broadcasting
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className="text-xs text-gray-400">
                Not Broadcasting
              </span>
            </div>
          )}
        </div>
        
        {/* Viewer Progress */}
        <div className="relative">
          <div className="flex items-center justify-center space-x-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < Math.min(viewerCount, 5)
                    ? 'bg-blue-500'
                    : 'bg-gray-700'
                }`}
              />
            ))}
            {viewerCount > 5 && (
              <span className="text-xs text-blue-400 ml-2">
                +{viewerCount - 5}
              </span>
            )}
          </div>
          
          {/* Connection Quality */}
          {isStreaming && (
            <div className="text-xs text-gray-400">
              <div className="flex justify-between items-center">
                <span>Connection Quality:</span>
                <span className="text-green-400">Excellent</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Stats */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Peak Viewers:</span>
            <span className="text-white">{Math.max(viewerCount, 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Stream Quality:</span>
            <span className="text-white">
              {isStreaming ? 'HD' : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Latency:</span>
            <span className="text-white">
              {isStreaming ? '~100ms' : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}