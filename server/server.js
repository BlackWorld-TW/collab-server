// server/server.js
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

// Хранилище сообщений (в памяти)
const messages = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
    // Отправить историю, если есть
    if (messages[room]) {
      socket.emit('room-history', messages[room]);
    } else {
      messages[room] = [];
    }
  });

  socket.on('send-message', ({ room, message, user }) => {
    const msgData = { user, message, timestamp: Date.now() };
    messages[room].push(msgData);
    io.to(room).emit('new-message', msgData);
  });

  // События для видео
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
    console.log('Client disconnected');
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});