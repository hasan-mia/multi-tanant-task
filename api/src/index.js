const http = require('http');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const app = require('./app');
const { connectDatabase } = require('./config/connectDatabase');
const { logError } = require('./utils/utils');
const seedDatabase = require('./scripts/seedDatabase');
const { connectSocket } = require('./config/connectSocket');
const { initPermissions } = require('./utils/permissions');
const db = require('./models');

// =========== Server Setup ============
const BASE_PORT = process.env.PORT || 3001;
const RESTART_DELAY = 3000;
const MAX_RESTART_ATTEMPTS = 5;
const FORCE_PORT_KILL = true;

let serverRestartCount = 0;
let isShuttingDown = false;
let serverInstance = null;
let portKillAttempts = 0;
const MAX_PORT_KILL_ATTEMPTS = 5;

// Function to kill process using a specific port
const killProcessOnPort = async (port) => {
  try {
    console.log(`Attempting to kill process on port ${port}...`);

    // For Windows
    if (process.platform === 'win32') {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = stdout.trim().split('\n');

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          await execAsync(`taskkill /PID ${pid} /F`).catch(() => {});
          console.log(`Killed process ${pid} on port ${port}`);
        }
      }
    } else {
      // For Linux/Mac: list PIDs that are actually LISTENing on the port.
      let pids = [];
      try {
        const { stdout } = await execAsync(
          `lsof -ti:${port} -sTCP:LISTEN`
        );
        pids = stdout.trim().split('\n').filter(Boolean);
      } catch (e) {
        // Fallback: any pid touching the port
        const { stdout } = await execAsync(`lsof -ti:${port}`);
        pids = stdout.trim().split('\n').filter(Boolean);
      }


      const targets = new Set();
      for (const pid of pids) {
        targets.add(pid);
        try {
          const { stdout } = await execAsync(
            `ps -o ppid=,pgid= -p ${pid}`
          );
          const [ppid, pgid] = stdout.trim().split(/\s+/).map((n) => n.trim());
          if (ppid && ppid !== '0' && ppid !== '1') targets.add(ppid);
          if (pgid && pgid !== '0' && pgid !== '1') targets.add(`-${pgid}`);
        } catch (e) {
          /* ignore */
        }
      }

      for (const target of targets) {
        const isGroup = String(target).startsWith('-');
        const flag = isGroup ? 'process group' : 'process';
        try {
          await execAsync(`kill -9 ${target}`);
          console.log(`Killed ${flag} ${target} on port ${port}`);
        } catch (e) {
          console.log(`Failed to kill ${flag} ${target}: ${e.message}`);
        }
      }

      // Hard fallback: fuser -k nukes everything bound to the port.
      try {
        await execAsync(`fuser -k ${port}/tcp`);
      } catch (e) {
        /* fuser may not be installed */
      }
    }

    // Wait for the OS to release the socket.
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Verify the port is actually free before reporting success.
    try {
      const { stdout } = await execAsync(`lsof -ti:${port} -sTCP:LISTEN`);
      if (stdout.trim()) {
        console.log(`Port ${port} is still in use after kill attempt.`);
        return false;
      }
    } catch (e) {
      // lsof returns non-zero when nothing is listening -> port is free
    }

    console.log(`Port ${port} is now free.`);
    return true;
  } catch (error) {
    console.log(
      `No process found on port ${port} or failed to kill:`,
      error.message
    );
    return false;
  }
};

// Main function to start the server
const startServer = async () => {
  try {
    const dbConnected = await connectDatabase();

    if (dbConnected) {
      try {
        await seedDatabase();
      } catch (error) {
        logError('Database seeding', error);
        console.log('Continuing without seeding...');
      }

      // Load the role -> permission mapping into cache for the new RBAC layer.
      try {
        await initPermissions();
      } catch (error) {
        logError('Permission cache init', error);
      }
    }

    await attemptToStartServer(BASE_PORT);
  } catch (error) {
    logError('Startup Error', error);
    retryStartup();
  }
};

// Attempts to start server on specific port, kills existing process if needed
const attemptToStartServer = async (port) => {
  return new Promise(async (resolve, reject) => {
    const server = http.createServer(app);

    // Connect socket.io after server is created
    connectSocket(server);

    serverInstance = server;

    server.listen(port);

    server.on('listening', () => {
      console.log(`Server running at http://localhost:${port}`);
      serverRestartCount = 0;
      portKillAttempts = 0;
      setupGracefulShutdown(server);
      resolve(server);
    });

    server.on('error', async (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use.`);

        if (FORCE_PORT_KILL && portKillAttempts < MAX_PORT_KILL_ATTEMPTS) {
          portKillAttempts++;
          console.log(
            `Attempting to kill existing process and retry... (${portKillAttempts}/${MAX_PORT_KILL_ATTEMPTS})`
          );
          const killed = await killProcessOnPort(port);

          if (killed) {
            // Try again after killing the process
            setTimeout(() => {
              attemptToStartServer(port).then(resolve).catch(reject);
            }, 2000);
          } else {
            reject(
              new Error(
                `Could not free port ${port} after ${portKillAttempts} attempts`
              )
            );
          }
        } else {
          reject(
            new Error(
              `Port ${port} is in use and could not be freed` +
                (FORCE_PORT_KILL ? ' (max kill attempts reached)' : ' (FORCE_PORT_KILL is disabled)')
            )
          );
        }
      } else {
        logError('Server error', error);
        reject(error);
      }
    });
  });
};

// Retry with delay on startup failure
const retryStartup = () => {
  if (serverRestartCount >= MAX_RESTART_ATTEMPTS) {
    console.error('Too many restart attempts. Manual intervention required.');
    process.exit(1);
  }

  serverRestartCount++;
  console.log(
    `Retrying server startup in ${
      RESTART_DELAY / 1000
    }s... (Attempt ${serverRestartCount}/${MAX_RESTART_ATTEMPTS})`
  );

  setTimeout(() => {
    startServer();
  }, RESTART_DELAY);
};

// Graceful shutdown handler
const setupGracefulShutdown = (server) => {
  const shutdown = async (signal) => {
    if (isShuttingDown) {
      console.log('Shutdown already in progress...');
      return;
    }

    isShuttingDown = true;
    console.log(`Received ${signal}. Shutting down gracefully...`);

    const timeout = setTimeout(() => {
      console.error('Forcing shutdown after timeout');
      process.exit(1);
    }, 15000);

    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await db.sequelize.close();
        console.log('Database connection closed.');
      } catch (err) {
        logError('Database closure', err);
      }
      clearTimeout(timeout);
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('uncaughtException', (err) => {
    logError('Uncaught Exception', err);

    if (!isShuttingDown && serverRestartCount < MAX_RESTART_ATTEMPTS) {
      console.log('Attempting to restart server due to uncaught exception...');
      if (serverInstance) {
        serverInstance.close(() => {
          retryStartup();
        });
      } else {
        retryStartup();
      }
    } else {
      console.error('Cannot recover from uncaught exception. Exiting.');
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    logError('Unhandled Promise Rejection', reason);
  });
};

// Start the server
startServer().catch((error) => {
  console.error('Fatal error during startup:', error);
  process.exit(1);
});

module.exports = app;
