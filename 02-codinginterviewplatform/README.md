# CodeInterview - Collaborative Coding Platform

A real-time collaborative coding interview platform built with React, Express.js, and Socket.io.

## Features

- ✅ **Create shareable interview rooms** - Generate unique links to share with candidates
- ✅ **Real-time collaboration** - All connected users see code changes instantly
- ✅ **Syntax highlighting** - Support for JavaScript, TypeScript, Python, Java, C++, C#, Go, Rust, and SQL
- ✅ **In-browser code execution** - Run JavaScript and Python code safely in the browser
- ✅ **Multi-user awareness** - See who's in the room

## Tech Stack

- **Frontend**: React + Vite + Monaco Editor (VS Code's editor)
- **Backend**: Express.js + Socket.io
- **Code Execution**: Sandboxed iframe (JavaScript) + Pyodide (Python)

## Project Structure

```
coding-interview-platform/
├── backend/
│   ├── package.json
│   └── server.js          # Express + Socket.io server
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        └── components/
            ├── Home.jsx        # Landing page
            ├── Room.jsx        # Main editor room
            └── CodeExecutor.jsx # Safe code execution
```

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation & Running

1. **Install and start the backend:**

```bash
cd backend
npm install
npm start
```

The backend will run on http://localhost:3001

2. **Install and start the frontend (in a new terminal):**

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on http://localhost:5173

3. **Open your browser** and go to http://localhost:5173

4. **Create a room** and share the link with others!

### Running Tests

Run the integration tests for the backend:

```bash
cd backend
npm test
```

This runs the Jest test suite which includes:
- REST API tests (room creation, retrieval, health check)
- WebSocket tests (joining rooms, code sync, language sync)
- User presence tests (join/leave notifications)
- End-to-end flow tests (complete interview session)

## How It Works

### Room Creation
1. User clicks "Create Interview Room" on the home page
2. Backend generates a unique 8-character room ID
3. User is redirected to `/room/{roomId}`

### Real-time Collaboration
1. Each user connects via WebSocket (Socket.io)
2. Code changes are broadcast to all users in the room
3. Language selection is synchronized across all users

### Code Execution
- **JavaScript**: Executed in a sandboxed iframe with captured console output
- **Python**: Uses Pyodide (Python compiled to WebAssembly)
- Other languages show syntax highlighting but don't execute in-browser

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rooms` | Create a new room |
| GET | `/api/rooms/:roomId` | Get room info |
| GET | `/api/health` | Health check |

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-room` | Client → Server | Join a room |
| `room-state` | Server → Client | Initial room state |
| `code-change` | Client → Server | User changed code |
| `code-update` | Server → Client | Broadcast code change |
| `language-change` | Client → Server | User changed language |
| `language-update` | Server → Client | Broadcast language change |
| `user-joined` | Server → Client | New user joined |
| `user-left` | Server → Client | User left |

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

### Backend (.env)
```
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Deployment Notes

For production deployment:

1. Set proper CORS origins in the backend
2. Use environment variables for URLs
3. Consider adding:
   - Room expiration/cleanup
   - User authentication
   - Rate limiting
   - Persistent storage (Redis/database)

## License

MIT
