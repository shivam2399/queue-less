const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./config/database');
const { Server } = require('socket.io');

const server = http.createServer(app);

// Mount Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOrigins = [env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'];
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(new Error('Socket.IO origin not allowed'));
    },
    credentials: true
  }
});

// Attach io instance to express app for route access
app.set('io', io);

// Basic socket room management
io.on('connection', (socket) => {
  // Join public business/date queue room
  socket.on('queue:join', ({ businessId, date }) => {
    if (businessId && date) {
      const room = `business:${businessId}:date:${date}`;
      socket.join(room);
    }
  });

  socket.on('queue:leave', ({ businessId, date }) => {
    if (businessId && date) {
      const room = `business:${businessId}:date:${date}`;
      socket.leave(room);
    }
  });
});

async function startServer() {
  try {
    // Authenticate database connection
    await sequelize.authenticate();
    console.log(`Database connected successfully (${env.DB_DIALECT})`);

    // In development or test, sync database if needed; never sync({alter: true}) in production
    if (env.NODE_ENV === 'development') {
      await sequelize.sync();
      console.log('Database synchronized (development)');
    }

    server.listen(env.PORT, () => {
      console.log(`QueueLess Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      console.log(`Health endpoint: http://localhost:${env.PORT}/health`);
      console.log(`API Base: http://localhost:${env.PORT}/api/v1`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful Shutdown
function shutdown(signal) {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await sequelize.close();
      console.log('Database connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error closing database connection:', err);
      process.exit(1);
    }
  });

  // Force close if graceful shutdown takes longer than 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

if (require.main === module) {
  startServer();
}

module.exports = { server, app, io };
