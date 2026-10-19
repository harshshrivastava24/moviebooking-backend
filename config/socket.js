import { Server } from 'socket.io';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join showtime specific room
    socket.on('join:showtime', (showtimeId) => {
      if (showtimeId) {
        const room = `showtime:${showtimeId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
      }
    });

    // Leave showtime specific room
    socket.on('leave:showtime', (showtimeId) => {
      if (showtimeId) {
        const room = `showtime:${showtimeId}`;
        socket.leave(room);
        console.log(`Socket ${socket.id} left room ${room}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

export const broadcastSeatUpdate = (showtimeId, eventType, data) => {
  if (!io) return;
  const room = `showtime:${showtimeId}`;
  io.to(room).emit(eventType, {
    showtimeId,
    timestamp: Date.now(),
    ...data,
  });
  console.log(`Broadcasted [${eventType}] to room [${room}]`, data);
};
