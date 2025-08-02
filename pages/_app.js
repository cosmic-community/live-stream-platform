import { useEffect } from 'react';
import '../app/globals.css';

/**
 * Custom App component for Next.js
 * Handles global app initialization and styling
 */
export default function App({ Component, pageProps }) {
  
  useEffect(() => {
    // Global app initialization
    console.log('🚀 Live Stream Platform initialized');
    
    // Check for WebRTC support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('⚠️ WebRTC not supported in this browser');
    }
    
    // Check for Socket.IO support
    if (typeof window !== 'undefined') {
      console.log('🌐 Client-side environment ready');
    }
  }, []);
  
  return (
    <div className="app">
      {/* Global Layout Wrapper */}
      <div className="min-h-screen bg-gray-900">
        <Component {...pageProps} />
      </div>
      
      {/* Global Footer */}
      <footer className="bg-gray-800 text-gray-300 py-4 text-center border-t border-gray-700">
        <p>🎥 Live Stream Platform - Built with Next.js, WebRTC & Socket.IO</p>
      </footer>
    </div>
  );
}