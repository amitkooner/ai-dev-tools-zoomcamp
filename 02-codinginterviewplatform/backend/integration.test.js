const http = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const express = require('express');
const request = require('supertest');

// Import server setup logic
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

describe('Coding Interview Platform Integration Tests', () => {
  let app, server, io, rooms;
  const PORT = 3002; // Use different port for tests
  const SOCKET_URL = `http://localhost:${PORT}`;

  beforeAll((done) => {
    // Set up Express app
    app = express();
    server = http.createServer(app);
    io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    app.use(cors());
    app.use(express.json());

    // Store active rooms
    rooms = new Map();

    // REST endpoints
    app.post('/api/rooms', (req, res) => {
      const roomId = uuidv4().slice(0, 8);
      rooms.set(roomId, {
        id: roomId,
        code: '// Welcome to the coding interview!\n',
        language: 'javascript',
        users: [],
        createdAt: new Date()
      });
      res.json({ roomId });
    });

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

    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', rooms: rooms.size });
    });

    // Socket.io handling
    io.on('connection', (socket) => {
      let currentRoom = null;
      let username = null;

      socket.on('join-room', ({ roomId, userName }) => {
        const room = rooms.get(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }
        
        currentRoom = roomId;
        username = userName || `User-${socket.id.slice(0, 4)}`;
        room.users.push({ id: socket.id, name: username });
        socket.join(roomId);
        
        socket.emit('room-state', {
          code: room.code,
          language: room.language,
          users: room.users
        });
        
        socket.to(roomId).emit('user-joined', {
          id: socket.id,
          name: username,
          users: room.users
        });
      });

      socket.on('code-change', ({ code }) => {
        if (!currentRoom) return;
        const room = rooms.get(currentRoom);
        if (room) {
          room.code = code;
          socket.to(currentRoom).emit('code-update', { code, userId: socket.id });
        }
      });

      socket.on('language-change', ({ language }) => {
        if (!currentRoom) return;
        const room = rooms.get(currentRoom);
        if (room) {
          room.language = language;
          io.to(currentRoom).emit('language-update', { language });
        }
      });

      socket.on('disconnect', () => {
        if (currentRoom) {
          const room = rooms.get(currentRoom);
          if (room) {
            room.users = room.users.filter(u => u.id !== socket.id);
            socket.to(currentRoom).emit('user-left', {
              id: socket.id,
              name: username,
              users: room.users
            });
          }
        }
      });
    });

    server.listen(PORT, done);
  });

  afterAll((done) => {
    io.close();
    server.close(done);
  });

  beforeEach(() => {
    // Clear rooms before each test
    rooms.clear();
  });

  // ==================== REST API Tests ====================

  describe('REST API', () => {
    test('POST /api/rooms - should create a new room', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .expect(200);

      expect(response.body).toHaveProperty('roomId');
      expect(response.body.roomId).toHaveLength(8);
    });

    test('GET /api/rooms/:roomId - should return room info', async () => {
      // First create a room
      const createResponse = await request(app)
        .post('/api/rooms')
        .expect(200);
      
      const { roomId } = createResponse.body;

      // Then fetch it
      const getResponse = await request(app)
        .get(`/api/rooms/${roomId}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty('id', roomId);
      expect(getResponse.body).toHaveProperty('code');
      expect(getResponse.body).toHaveProperty('language', 'javascript');
      expect(getResponse.body).toHaveProperty('userCount', 0);
    });

    test('GET /api/rooms/:roomId - should return 404 for non-existent room', async () => {
      const response = await request(app)
        .get('/api/rooms/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Room not found');
    });

    test('GET /api/health - should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('rooms');
    });
  });

  // ==================== WebSocket Tests ====================

  describe('WebSocket Communication', () => {
    let clientSocket;
    let roomId;

    beforeEach(async () => {
      // Create a room for socket tests
      const response = await request(app).post('/api/rooms');
      roomId = response.body.roomId;
    });

    afterEach(() => {
      if (clientSocket && clientSocket.connected) {
        clientSocket.disconnect();
      }
    });

    test('should connect and join a room', (done) => {
      clientSocket = Client(SOCKET_URL);

      clientSocket.on('connect', () => {
        clientSocket.emit('join-room', { roomId, userName: 'TestUser' });
      });

      clientSocket.on('room-state', (data) => {
        expect(data).toHaveProperty('code');
        expect(data).toHaveProperty('language', 'javascript');
        expect(data).toHaveProperty('users');
        expect(data.users).toHaveLength(1);
        expect(data.users[0].name).toBe('TestUser');
        done();
      });
    });

    test('should receive error when joining non-existent room', (done) => {
      clientSocket = Client(SOCKET_URL);

      clientSocket.on('connect', () => {
        clientSocket.emit('join-room', { roomId: 'badroom1', userName: 'TestUser' });
      });

      clientSocket.on('error', (data) => {
        expect(data).toHaveProperty('message', 'Room not found');
        done();
      });
    });

    test('should broadcast code changes to other users', (done) => {
      const client1 = Client(SOCKET_URL);
      const client2 = Client(SOCKET_URL);
      
      let client1Joined = false;
      let client2Joined = false;

      const checkBothJoined = () => {
        if (client1Joined && client2Joined) {
          // Client 1 sends a code change
          client1.emit('code-change', { code: 'const x = 42;' });
        }
      };

      client1.on('connect', () => {
        client1.emit('join-room', { roomId, userName: 'User1' });
      });

      client1.on('room-state', () => {
        client1Joined = true;
        checkBothJoined();
      });

      client2.on('connect', () => {
        client2.emit('join-room', { roomId, userName: 'User2' });
      });

      client2.on('room-state', () => {
        client2Joined = true;
        checkBothJoined();
      });

      // Client 2 should receive the code update
      client2.on('code-update', (data) => {
        expect(data).toHaveProperty('code', 'const x = 42;');
        client1.disconnect();
        client2.disconnect();
        done();
      });
    });

    test('should broadcast language changes to all users', (done) => {
      const client1 = Client(SOCKET_URL);
      const client2 = Client(SOCKET_URL);
      
      let client1Joined = false;
      let client2Joined = false;

      const checkBothJoined = () => {
        if (client1Joined && client2Joined) {
          client1.emit('language-change', { language: 'python' });
        }
      };

      client1.on('connect', () => {
        client1.emit('join-room', { roomId, userName: 'User1' });
      });

      client1.on('room-state', () => {
        client1Joined = true;
        checkBothJoined();
      });

      client2.on('connect', () => {
        client2.emit('join-room', { roomId, userName: 'User2' });
      });

      client2.on('room-state', () => {
        client2Joined = true;
        checkBothJoined();
      });

      // Both clients should receive language update
      client2.on('language-update', (data) => {
        expect(data).toHaveProperty('language', 'python');
        client1.disconnect();
        client2.disconnect();
        done();
      });
    });

    test('should notify other users when someone joins', (done) => {
      const client1 = Client(SOCKET_URL);
      const client2 = Client(SOCKET_URL);

      // Set up the user-joined listener BEFORE client2 joins
      client1.on('user-joined', (data) => {
        expect(data).toHaveProperty('name', 'User2');
        expect(data.users).toHaveLength(2);
        client1.disconnect();
        client2.disconnect();
        done();
      });

      client1.on('connect', () => {
        client1.emit('join-room', { roomId, userName: 'User1' });
      });

      client1.on('room-state', () => {
        // Client 1 is in and listener is ready, now client 2 joins
        client2.emit('join-room', { roomId, userName: 'User2' });
      });
    });

    test('should notify other users when someone leaves', (done) => {
      const client1 = Client(SOCKET_URL);
      const client2 = Client(SOCKET_URL);

      // Set up all listeners first
      client1.on('user-left', (data) => {
        expect(data).toHaveProperty('name', 'User2');
        expect(data.users).toHaveLength(1);
        client1.disconnect();
        done();
      });

      client1.on('user-joined', () => {
        // Both joined, now client 2 leaves
        client2.disconnect();
      });

      client1.on('connect', () => {
        client1.emit('join-room', { roomId, userName: 'User1' });
      });

      client1.on('room-state', () => {
        // Client 1 is ready, now client 2 joins
        client2.emit('join-room', { roomId, userName: 'User2' });
      });
    });
  });

  // ==================== End-to-End Flow Tests ====================

  describe('End-to-End Flows', () => {
    test('complete interview session flow', async () => {
      // 1. Create a room via REST API
      const createResponse = await request(app)
        .post('/api/rooms')
        .expect(200);
      
      const { roomId } = createResponse.body;
      expect(roomId).toHaveLength(8);

      // 2. Verify room exists
      const roomResponse = await request(app)
        .get(`/api/rooms/${roomId}`)
        .expect(200);
      
      expect(roomResponse.body.id).toBe(roomId);

      // 3. Two users connect and collaborate
      const interviewer = Client(SOCKET_URL);
      const candidate = Client(SOCKET_URL);

      await new Promise((resolve) => {
        let interviewerReady = false;
        let candidateReady = false;

        interviewer.on('connect', () => {
          interviewer.emit('join-room', { roomId, userName: 'Interviewer' });
        });

        interviewer.on('room-state', () => {
          interviewerReady = true;
          if (candidateReady) resolve();
        });

        candidate.on('connect', () => {
          candidate.emit('join-room', { roomId, userName: 'Candidate' });
        });

        candidate.on('room-state', () => {
          candidateReady = true;
          if (interviewerReady) resolve();
        });
      });

      // 4. Candidate writes code, interviewer sees it
      await new Promise((resolve) => {
        interviewer.on('code-update', (data) => {
          expect(data.code).toBe('function solution() { return 42; }');
          resolve();
        });

        candidate.emit('code-change', { code: 'function solution() { return 42; }' });
      });

      // 5. Verify room state was updated
      const finalRoomState = await request(app)
        .get(`/api/rooms/${roomId}`)
        .expect(200);
      
      expect(finalRoomState.body.userCount).toBe(2);

      // Cleanup
      interviewer.disconnect();
      candidate.disconnect();
    });
  });
});
