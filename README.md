# Live Stream Platform

![App Preview](https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=300&fit=crop&auto=format)

A full-stack live streaming application built with Next.js and Socket.IO that enables real-time video broadcasting to multiple viewers using WebRTC technology.

## ✨ Features

- **Real-time Video Streaming** - WebRTC-powered broadcasting with low latency
- **Dual Media Sources** - Support for both camera and screen capture streaming  
- **Multi-viewer Support** - One-to-many broadcasting architecture
- **Socket.IO Signaling** - Robust WebRTC signaling and connection management
- **Responsive Design** - Optimized for desktop and mobile viewing experiences
- **Auto-reconnection** - Intelligent handling of connection drops and network issues
- **STUN Server Integration** - Google STUN servers for NAT traversal
- **Real-time Connection Status** - Live indicators for stream and viewer status

## Clone this Bucket and Code Repository

Want to create your own version of this project with all the content and structure? Clone this Cosmic bucket and code repository to get started instantly:

[![Clone this Bucket and Code Repository](https://img.shields.io/badge/Clone%20this%20Bucket-29abe2?style=for-the-badge&logo=cosmic&logoColor=white)](https://app.cosmic-staging.com/projects/new?clone_bucket=6888e0ab2dcc7fbc00c94e31&clone_repository=688ea1e8a07f0c8e05e4d091)

## Prompts

This application was built using the following prompts to generate the content structure and code:

### Content Model Prompt

> No content model prompt provided - app built from existing content structure

### Code Generation Prompt

> "Create a full-stack live-streaming app using Next.js (React) and Node.js. Specs:
> 
> Backend (pages/api):
> 
> Use Next.js API routes with socket.io for signaling (offer/answer/ICE).
> 
> No database needed.
> 
> Frontend (React):
> 
> Two pages: /broadcast and /watch.
> 
> On /broadcast:
> 
> Buttons: 'Start Camera', 'Start Screen Share', and 'End Stream'.
> 
> Capture media with getUserMedia and getDisplayMedia.
> 
> Use a single RTCPeerConnection; add tracks to it.
> 
> Send SDP and ICE candidates via socket.io to the server, broadcast to watchers.
> 
> On /watch:
> 
> Connect to the same socket.io channel; receive SDP offer, answer, ICE.
> 
> Attach incoming media to a <video> element.
> 
> Extra details:
> 
> Include STUN server config (stun:stun.l.google.com:19302).
> 
> Handle multiple watchers gracefully (one-to-many).
> 
> Provide full code, file structure, and step-by-step comments."

The app has been tailored to work with your existing Cosmic content structure and includes all the features requested above.

## 🛠️ Technologies Used

- **Next.js 15** - React framework with App Router
- **Socket.IO** - Real-time bidirectional communication
- **WebRTC** - Peer-to-peer streaming technology
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Hooks** - Modern React state management

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Bun (recommended) or npm
- Modern browser with WebRTC support
- HTTPS for production (required for getUserMedia)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd live-stream-platform
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Start development server**
   ```bash
   bun run dev
   ```

4. **Open the application**
   - Navigate to `http://localhost:3000`
   - Go to `/broadcast` to start streaming
   - Go to `/watch` to view streams

### Usage

#### Broadcasting
1. Visit `/broadcast`
2. Click "Start Camera" to begin camera streaming
3. Or click "Start Screen Share" for screen capture
4. Share the watch link with viewers
5. Click "End Stream" to stop broadcasting

#### Watching
1. Visit `/watch` while a stream is active
2. Video will automatically load when broadcaster starts
3. Real-time connection status indicators

## 🔧 Socket.IO Integration

The application uses Socket.IO for WebRTC signaling:

```typescript
// Example: Sending offer to watchers
socket.emit('offer', {
  sdp: peerConnection.localDescription,
  streamId: 'main-stream'
});

// Example: Receiving answer from watcher
socket.on('answer', async (data) => {
  await peerConnection.setRemoteDescription(data.sdp);
});
```

## 📡 WebRTC Configuration

The app uses Google's STUN servers for NAT traversal:

```typescript
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};
```

## 🌐 Deployment Options

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Deploy automatically on push to main branch
3. HTTPS is provided automatically for WebRTC compatibility

### Netlify
1. Build command: `bun run build`
2. Publish directory: `out` or `.next`
3. Enable HTTPS for production usage

### Environment Variables
No environment variables required for basic functionality.

### Production Notes
- HTTPS is required for `getUserMedia` and `getDisplayMedia`
- Consider implementing authentication for private streams
- Monitor bandwidth usage for multiple concurrent viewers
- Add error logging and analytics for production monitoring

## 🔒 Security Considerations

- All WebRTC connections are peer-to-peer encrypted
- No video data passes through the server
- Socket.IO handles only signaling data
- Consider adding authentication for production use

<!-- README_END -->