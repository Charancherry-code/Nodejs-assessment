const mysql = require('mysql2/promise');

// Enable TLS automatically for managed providers (TiDB Cloud, Aiven, PlanetScale, etc.)
// Set DB_SSL=true in production to require TLS.
const useSsl = String(process.env.DB_SSL || '').toLowerCase() === 'true';

/**
 * Resolve DB connection details from individual DB_* / MYSQL* vars,
 * or fall back to a full connection URL (MYSQL_URL / DATABASE_URL),
 * which Railway and most managed providers expose by default.
 */
function resolveDbConfig() {
  const url = process.env.MYSQL_URL || process.env.DATABASE_URL;
  if (url) {
    try {
      const u = new URL(url);
      return {
        host: u.hostname,
        port: Number(u.port) || 3306,
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: u.pathname.replace(/^\//, '') || 'github_analyzer'
      };
    } catch (err) {
      console.warn('Could not parse MYSQL_URL/DATABASE_URL, falling back to discrete vars:', err.message);
    }
  }
  return {
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password:
      process.env.DB_PASSWORD ||
      process.env.MYSQLPASSWORD ||
      process.env.MYSQL_ROOT_PASSWORD ||
      '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'github_analyzer'
  };
}

const dbConfig = resolveDbConfig();

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  ssl: useSsl ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined
});

const CREATE_PROFILES_TABLE = `
  CREATE TABLE IF NOT EXISTS profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    github_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NULL,
    bio TEXT NULL,
    company VARCHAR(255) NULL,
    location VARCHAR(255) NULL,
    blog VARCHAR(500) NULL,
    email VARCHAR(255) NULL,
    twitter_username VARCHAR(255) NULL,
    avatar_url VARCHAR(500) NULL,
    html_url VARCHAR(500) NULL,
    public_repos INT DEFAULT 0,
    public_gists INT DEFAULT 0,
    followers INT DEFAULT 0,
    following INT DEFAULT 0,
    total_stars INT DEFAULT 0,
    total_forks INT DEFAULT 0,
    total_watchers INT DEFAULT 0,
    top_language VARCHAR(100) NULL,
    languages_json JSON NULL,
    top_repo_name VARCHAR(255) NULL,
    top_repo_stars INT DEFAULT 0,
    top_repo_url VARCHAR(500) NULL,
    account_age_days INT DEFAULT 0,
    hireable TINYINT(1) NULL,
    github_created_at DATETIME NULL,
    github_updated_at DATETIME NULL,
    last_analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_followers (followers),
    INDEX idx_total_stars (total_stars)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

/**
 * Ensures the database and required tables exist.
 * The DB itself must be created beforehand (see scripts/initDb.js or README).
 */
async function ensureSchema() {
  const conn = await pool.getConnection();
  try {
    await conn.query(CREATE_PROFILES_TABLE);
    console.log('Database schema verified.');
  } finally {
    conn.release();
  }
}

module.exports = { pool, ensureSchema };
