const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

let isShutingdown = false;

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
  isShutingdown = false;
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

async function gracefull_shutdown(signal) {
  console.log(`Recived ${signal}, shutdown......`);
  if (isShutingdown) {
    console.log('Already shutdown');
  } else {
    isShutingdown = true;
    try {
      console.log('Wait pool close');
      await pool.end();
      console.log('Connection closed');
      process.exit(0);
    } catch (error) {
      console.log(`Trouble with db connection shutdown: ${error}`);
      process.exit(1);
    }
  }
}

process.on('SIGTERM', gracefull_shutdown);
process.on('SIGINT', gracefull_shutdown);

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefull_shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefull_shutdown('UNHANDLED_REJECTION');
});

module.exports = {
  query: (text, params) => {
    if (isShutingdown) {
      return Promise.reject(new Error('Server is shutting down'));
    }
    return pool.query(text, params);
  },
  pool,
  isShutingdown: () => isShutingdown,
};
