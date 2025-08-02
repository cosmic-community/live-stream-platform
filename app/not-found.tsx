import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-6xl mb-4">📡</div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-400 mb-6">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="space-y-3">
          <Link href="/" className="btn-primary block">
            Go to Home
          </Link>
          <Link href="/broadcast" className="btn-secondary block bg-blue-700 hover:bg-blue-600 text-white">
            Start Broadcasting
          </Link>
          <Link href="/watch" className="btn-secondary block bg-green-700 hover:bg-green-600 text-white">
            Watch Streams
          </Link>
        </div>
      </div>
    </div>
  );
}