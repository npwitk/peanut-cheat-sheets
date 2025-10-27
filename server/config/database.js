const mysql = require('mysql2');
require('dotenv').config();

// Create MySQL connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'cheat_sheet_marketplace',
  // Increased connection limits for rapid requests
  connectionLimit: 20, // Increased from 10 to 20
  waitForConnections: true,
  queueLimit: 0, // Unlimited queue
  charset: 'utf8mb4',
  timezone: '+07:00',
  // Connection health settings
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Prevent connection timeouts
  connectTimeout: 10000, // 10 seconds
  // Keep idle connections longer to handle bursts
  idleTimeout: 60000, // Increased from 30s to 60s
  // Maximum lifetime of a connection
  maxIdle: 20, // Match connectionLimit
});

// Promisify for async/await usage
const promisePool = pool.promise();

// Handle pool errors
pool.on('error', (err) => {
  console.error('MySQL pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  }
  if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('Database has too many connections.');
  }
  if (err.code === 'ECONNREFUSED') {
    console.error('Database connection was refused.');
  }
});

// Test database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    console.error('Please check your database credentials and ensure MySQL is running.');
    // Don't exit in production, allow retry
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    return;
  }

  console.log('Connected to MySQL database');
  connection.release();
});

// Monitor pool connection usage (only log in development to reduce noise)
if (process.env.NODE_ENV === 'development') {
  pool.on('acquire', (connection) => {
    console.log('Connection %d acquired', connection.threadId);
  });

  pool.on('release', (connection) => {
    console.log('Connection %d released', connection.threadId);
  });
}

pool.on('enqueue', () => {
  console.log('Waiting for available connection slot - pool may be exhausted');
});

// Keep-alive mechanism: ping database every 5 minutes to prevent timeout
let keepAliveInterval = setInterval(async () => {
  try {
    const connection = await promisePool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    console.log('Database connection keep-alive ping');
  } catch (error) {
    console.error('Keep-alive ping failed:', error.message);
  }
}, 5 * 60 * 1000); // 5 minutes

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing database connections...');
  clearInterval(keepAliveInterval);
  pool.end((err) => {
    if (err) {
      console.error('Error closing database pool:', err);
    } else {
      console.log('Database pool closed successfully');
    }
    process.exit(0);
  });
});

// Helper function to retry database operations
async function retryOperation(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isConnectionError =
        error.code === 'PROTOCOL_CONNECTION_LOST' ||
        error.code === 'ECONNRESET' ||
        error.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' ||
        error.code === 'ETIMEDOUT';

      if (isConnectionError && attempt < maxRetries) {
        console.log(`Database connection error, retrying (attempt ${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}

// Database utility functions
const db = {
  // Execute a query with parameters
  async query(sql, params = []) {
    return retryOperation(async () => {
      try {
        const [rows] = await promisePool.execute(sql, params);
        return rows;
      } catch (error) {
        console.error('Database query error:', error.message);
        console.error('SQL:', sql);
        throw error;
      }
    });
  },

  // Get a single row
  async queryOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  },

  // Insert and return the inserted ID
  async insert(sql, params = []) {
    return retryOperation(async () => {
      try {
        const [result] = await promisePool.execute(sql, params);
        return result.insertId;
      } catch (error) {
        console.error('Database insert error:', error.message);
        console.error('SQL:', sql);
        throw error;
      }
    });
  },

  // Update and return affected rows
  async update(sql, params = []) {
    return retryOperation(async () => {
      try {
        const [result] = await promisePool.execute(sql, params);
        return result.affectedRows;
      } catch (error) {
        console.error('Database update error:', error.message);
        console.error('SQL:', sql);
        throw error;
      }
    });
  },

  // Delete and return affected rows
  async delete(sql, params = []) {
    return retryOperation(async () => {
      try {
        const [result] = await promisePool.execute(sql, params);
        return result.affectedRows;
      } catch (error) {
        console.error('Database delete error:', error.message);
        console.error('SQL:', sql);
        throw error;
      }
    });
  },

  // Begin transaction
  async beginTransaction() {
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();
    return connection;
  },

  // Commit transaction
  async commit(connection) {
    await connection.commit();
    connection.release();
  },

  // Rollback transaction
  async rollback(connection) {
    await connection.rollback();
    connection.release();
  },

  // Close all connections
  end() {
    pool.end();
  }
};

module.exports = db;