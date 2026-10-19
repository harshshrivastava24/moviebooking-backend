import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import './config/redis.js'; // Initialize Redis client connection logging

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Create HTTP server & Socket.io server
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
  console.log(`Client URL allowed: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`==================================================\n`);
});
