const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const messages = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
    if (!messages[room]) messages[room] = [];
    const history = messages[room].slice(-50);
    socket.emit('room-history', history);
  });

  socket.on('send-message', ({ room, message, user }) => {
    const msgData = { user, message, timestamp: Date.now() };
    if (!messages[room]) messages[room] = [];
    messages[room].push(msgData);
    io.to(room).emit('new-message', msgData);
  });

  socket.on('sync-play', ({ room }) => {
    socket.to(room).emit('sync-play');
  });
  socket.on('sync-pause', ({ room }) => {
    socket.to(room).emit('sync-pause');
  });
  socket.on('sync-seek', ({ room, time }) => {
    socket.to(room).emit('sync-seek', { time });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
