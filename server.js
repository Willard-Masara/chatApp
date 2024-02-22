const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2/promise');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'your_mysql_user',
  password: 'your_mysql_password',
  database: 'chat_app',
  connectionLimit: 10,
});

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log('A client connected');

  // Handle incoming messages
  socket.on('message', async (data) => {
    console.log('Received message:', data);

    try {
      const { sender, message, latitude, longitude } = data;

      // Insert the message into the database
      const connection = await pool.getConnection();
      const [result] = await connection.query(
        'INSERT INTO messages (sender, message, latitude, longitude) VALUES (?, ?, ?, ?)',
        [sender, message, latitude, longitude]
      );
      connection.release();

      // Broadcast the message to all connected clients
      io.emit('newMessage', { id: result.insertId, sender, message, latitude, longitude });
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });
});

server.listen(3001, () => {
  console.log('Server is running on port 3001');
});

