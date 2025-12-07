const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active rooms with their code state
const rooms = new Map();

// Create a new room
app.post('/api/rooms', (req, res) => {
  const roomId = uuidv4().slice(0, 8); // Short 8-character ID
  rooms.set(roomId, {
    id: roomId,
    code: '// Welcome to the coding interview!\n// Start writing your code here...\n\nfunction solution() {\n  // Your code here\n}\n',
    language: 'javascript',
    users: [],
    createdAt: new Date()
  });
  
  console.log(`Room created: ${roomId}`);
  res.json({ roomId });
});

// Get room info
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({
    id: room.id,
    code: room.code,
    language: room.language,
    userCount: room.users.length
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  let currentRoom = null;
  let username = null;

  // Join a room
  socket.on('join-room', ({ roomId, userName }) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    currentRoom = roomId;
    username = userName || `User-${socket.id.slice(0, 4)}`;
    
    // Add user to room
    room.users.push({ id: socket.id, name: username });
    socket.join(roomId);
    
    // Send current state to the joining user
    socket.emit('room-state', {
      code: room.code,
      language: room.language,
      users: room.users
    });
    
    // Notify others that a new user joined
    socket.to(roomId).emit('user-joined', {
      id: socket.id,
      name: username,
      users: room.users
    });
    
    console.log(`${username} joined room ${roomId}`);
  });

  // Handle code changes
  socket.on('code-change', ({ code }) => {
    if (!currentRoom) return;
    
    const room = rooms.get(currentRoom);
    if (room) {
      room.code = code;
      // Broadcast to all other users in the room
      socket.to(currentRoom).emit('code-update', { code, userId: socket.id });
    }
  });

  // Handle language changes
  socket.on('language-change', ({ language }) => {
    if (!currentRoom) return;
    
    const room = rooms.get(currentRoom);
    if (room) {
      room.language = language;
      // Broadcast to all users in the room including sender
      io.to(currentRoom).emit('language-update', { language });
    }
  });

  // Handle cursor position updates (for showing where others are typing)
  socket.on('cursor-update', ({ position, selection }) => {
    if (!currentRoom) return;
    
    socket.to(currentRoom).emit('cursor-move', {
      userId: socket.id,
      userName: username,
      position,
      selection
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    if (currentRoom) {
      const room = rooms.get(currentRoom);
      if (room) {
        // Remove user from room
        room.users = room.users.filter(u => u.id !== socket.id);
        
        // Notify others
        socket.to(currentRoom).emit('user-left', {
          id: socket.id,
          name: username,
          users: room.users
        });
        
        // Clean up empty rooms after 1 hour
        if (room.users.length === 0) {
          setTimeout(() => {
            const currentRoom = rooms.get(currentRoom);
            if (currentRoom && currentRoom.users.length === 0) {
              rooms.delete(currentRoom);
              console.log(`Room ${currentRoom} deleted (empty)`);
            }
          }, 3600000); // 1 hour
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
