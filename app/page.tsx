import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Stream Platform - Home',
  description: 'Choose to broadcast or watch live streams',
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            Live Stream Platform
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Professional live streaming with WebRTC technology. 
            Broadcast to multiple viewers with low latency and high quality.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Broadcast Card */}
          <div className="glass-effect p-8 rounded-2xl hover:bg-opacity-20 transition-all duration-300 group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
              📡
            </div>
            <h2 className="text-2xl font-bold mb-4 text-blue-400">Start Broadcasting</h2>
            <p className="text-gray-300 mb-6">
              Share your camera or screen with multiple viewers. 
              Perfect for presentations, tutorials, or live events.
            </p>
            <ul className="text-sm text-gray-400 mb-6 space-y-2">
              <li>• Camera & screen sharing</li>
              <li>• Multi-viewer support</li>
              <li>• Real-time connection status</li>
              <li>• HD video quality</li>
            </ul>
            <Link 
              href="/broadcast"
              className="btn-primary inline-block px-8 py-3 text-lg font-semibold group-hover:scale-105 transition-transform duration-300"
            >
              Start Broadcasting
            </Link>
          </div>

          {/* Watch Card */}
          <div className="glass-effect p-8 rounded-2xl hover:bg-opacity-20 transition-all duration-300 group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
              👀
            </div>
            <h2 className="text-2xl font-bold mb-4 text-green-400">Watch Streams</h2>
            <p className="text-gray-300 mb-6">
              Join live streams and watch in real-time. 
              Automatic connection handling and optimized viewing experience.
            </p>
            <ul className="text-sm text-gray-400 mb-6 space-y-2">
              <li>• Instant stream joining</li>
              <li>• Auto-reconnection</li>
              <li>• Responsive video player</li>
              <li>• Connection indicators</li>
            </ul>
            <Link 
              href="/watch"
              className="btn-success inline-block px-8 py-3 text-lg font-semibold group-hover:scale-105 transition-transform duration-300"
            >
              Watch Streams
            </Link>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="glass-effect p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4 text-gray-200">Built With</h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            <span className="bg-blue-500 bg-opacity-20 px-3 py-1 rounded-full">Next.js 15</span>
            <span className="bg-green-500 bg-opacity-20 px-3 py-1 rounded-full">WebRTC</span>
            <span className="bg-purple-500 bg-opacity-20 px-3 py-1 rounded-full">Socket.IO</span>
            <span className="bg-yellow-500 bg-opacity-20 px-3 py-1 rounded-full">TypeScript</span>
            <span className="bg-pink-500 bg-opacity-20 px-3 py-1 rounded-full">Tailwind CSS</span>
          </div>
        </div>

        {/* Status Note */}
        <div className="mt-8 text-sm text-gray-500">
          <p>
            🔒 All connections are peer-to-peer encrypted. 
            No video data passes through our servers.
          </p>
        </div>
      </div>
    </div>
  );
}