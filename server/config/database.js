const mysql = require('mysql2');
require('dotenv').config();

// Base pool configuration shared across all pools
const basePoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'cheat_sheet_marketplace',
  waitForConnections: true,
  queueLimit: 0, // Unlimited queue
  charset: 'utf8mb4',
  timezone: '+07:00',
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000, // 10 seconds
  idleTimeout: 60000,
};

// Executive Pool - For admin and staff operations (full access)
const executivePool = mysql.createPool({
  ...basePoolConfig,
  user: process.env.DB_EXECUTIVE_USER || process.env.DB_USER || 'root',
  password: process.env.DB_EXECUTIVE_PASSWORD || process.env.DB_PASSWORD,
  connectionLimit: 10, // Smaller pool for admin operations
  maxIdle: 10,
});

// Application Pool - For authenticated user operations (read/write)
const applicationPool = mysql.createPool({
  ...basePoolConfig,
  user: process.env.DB_APP_USER || process.env.DB_USER || 'root',
  password: process.env.DB_APP_PASSWORD || process.env.DB_PASSWORD,
  connectionLimit: 20, // Larger pool for regular operations
  maxIdle: 20,
});

// Public Pool - For unauthenticated/public operations (read-only)
const publicPool = mysql.createPool({
  ...basePoolConfig,
  user: process.env.DB_PUBLIC_USER || process.env.DB_USER || 'root',
  password: process.env.DB_PUBLIC_PASSWORD || process.env.DB_PASSWORD,
  connectionLimit: 15, // Medium pool for public queries
  maxIdle: 15,
});

// Promisify pools for async/await usage
const promiseExecutivePool = executivePool.promise();
const promiseApplicationPool = applicationPool.promise();
const promisePublicPool = publicPool.promise();

// Legacy pool reference (defaults to application pool for backward compatibility)
const pool = applicationPool;
const promisePool = promiseApplicationPool;

// Error handler for all pools
const setupPoolErrorHandlers = (poolInstance, poolName) => {
  poolInstance.on('error', (err) => {
    console.error(`MySQL ${poolName} pool error:`, err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error(`${poolName}: Database connection was closed.`);
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error(`${poolName}: Database has too many connections.`);
    }
    if (err.code === 'ECONNREFUSED') {
      console.error(`${poolName}: Database connection was refused.`);
    }
  });

  poolInstance.on('enqueue', () => {
    console.log(`${poolName}: Waiting for available connection slot - pool may be exhausted`);
  });

  // Monitor pool connection usage (only log in development to reduce noise)
  if (process.env.NODE_ENV === 'development') {
    poolInstance.on('acquire', (connection) => {
      console.log(`${poolName}: Connection %d acquired`, connection.threadId);
    });

    poolInstance.on('release', (connection) => {
      console.log(`${poolName}: Connection %d released`, connection.threadId);
    });
  }
};

// Setup error handlers for all pools
setupPoolErrorHandlers(executivePool, 'Executive');
setupPoolErrorHandlers(applicationPool, 'Application');
setupPoolErrorHandlers(publicPool, 'Public');

// Test all database connections
const testPoolConnection = (poolInstance, poolName) => {
  poolInstance.getConnection((err, connection) => {
    if (err) {
      console.error(`${poolName} pool connection failed:`, err.message);
      console.error('Please check your database credentials and ensure MySQL is running.');
      // Don't exit in production, allow retry
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      }
      return;
    }

    console.log(`✓ Connected to MySQL database (${poolName} pool)`);
    connection.release();
  });
};

// Test all pools
testPoolConnection(executivePool, 'Executive');
testPoolConnection(applicationPool, 'Application');
testPoolConnection(publicPool, 'Public');

// Keep-alive mechanism: ping all pools every 5 minutes to prevent timeout
let keepAliveInterval = setInterval(async () => {
  const pools = [
    { pool: promiseExecutivePool, name: 'Executive' },
    { pool: promiseApplicationPool, name: 'Application' },
    { pool: promisePublicPool, name: 'Public' }
  ];

  for (const { pool, name } of pools) {
    try {
      const connection = await pool.getConnection();
      await connection.query('SELECT 1');
      connection.release();
      console.log(`${name} pool: Keep-alive ping successful`);
    } catch (error) {
      console.error(`${name} pool: Keep-alive ping failed:`, error.message);
    }
  }
}, 5 * 60 * 1000); // 5 minutes

// Graceful shutdown - close all pools
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing all database connections...');
  clearInterval(keepAliveInterval);

  let poolsClosed = 0;
  const totalPools = 3;

  const checkAllClosed = () => {
    poolsClosed++;
    if (poolsClosed === totalPools) {
      console.log('All database pools closed successfully');
      process.exit(0);
    }
  };

  executivePool.end((err) => {
    if (err) console.error('Error closing Executive pool:', err);
    else console.log('Executive pool closed');
    checkAllClosed();
  });

  applicationPool.end((err) => {
    if (err) console.error('Error closing Application pool:', err);
    else console.log('Application pool closed');
    checkAllClosed();
  });

  publicPool.end((err) => {
    if (err) console.error('Error closing Public pool:', err);
    else console.log('Public pool closed');
    checkAllClosed();
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

// Helper function to select appropriate pool based on context
const selectPool = (context = {}) => {
  // Context can include: { userRole: 'executive'|'application'|'public', pool: 'executive'|'application'|'public' }

  // Allow explicit pool selection
  if (context.pool === 'executive') {
    return promiseExecutivePool;
  }
  if (context.pool === 'public') {
    return promisePublicPool;
  }
  if (context.pool === 'application') {
    return promiseApplicationPool;
  }

  // Auto-select based on user role
  if (context.userRole === 'executive') {
    return promiseExecutivePool;
  }
  if (context.userRole === 'public') {
    return promisePublicPool;
  }

  // Default to application pool
  return promiseApplicationPool;
};

// Database utility functions with pool selection support
const db = {
  // Execute a query with parameters
  async query(sql, params = [], context = {}) {
    const pool = selectPool(context);
    return retryOperation(async () => {
      try {
        const [rows] = await pool.execute(sql, params);
        return rows;
      } catch (error) {
        console.error('Database query error:', error.message);
        console.error('SQL:', sql);
        throw error;
      }
    });
  },

  // Get a single row
  async queryOne(sql, params = [], context = {}) {
    const rows = await this.query(sql, params, context);
    return rows[0] || null;
  },

  // Insert and return the inserted ID
  async insert(sql, params = [], context = {}) {
    const pool = selectPool(context);
    return retryOperation(async () => {
      try {
        const [result] = await pool.execute(sql, params);
        return result.insertId;
      } catch (error) {
        console.error('Database insert error:', error.message);
        console.error('SQL:', sql);
        throw error;
      }
    });
  },

  // Update and return affected rows
  async update(sql, params = [], context = {}) {
    const pool = selectPool(context);
    return retryOperation(async () => {
      try {
        const [result] = await pool.execute(sql, params);
        return result.affectedRows;
      } catch (error) {
        console.error('Database update error:', error.message);
        console.error('SQL:', sql);
        throw error;
      }
    });
  },

  // Delete and return affected rows
  async delete(sql, params = [], context = {}) {
    const pool = selectPool(context);
    return retryOperation(async () => {
      try {
        const [result] = await pool.execute(sql, params);
        return result.affectedRows;
      } catch (error) {
        console.error('Database delete error:', error.message);
        console.error('SQL:', sql);
        throw error;
      }
    });
  },

  // Begin transaction (with pool selection)
  async beginTransaction(context = {}) {
    const pool = selectPool(context);
    const connection = await pool.getConnection();
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
    executivePool.end();
    applicationPool.end();
    publicPool.end();
  },

  // Direct pool access for advanced use cases
  pools: {
    executive: promiseExecutivePool,
    application: promiseApplicationPool,
    public: promisePublicPool,
  }
};

module.exports = db;