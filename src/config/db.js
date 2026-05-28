const mysql = require('mysql2/promise');

// Read Railway-style env vars first, then fall back to local DB_* vars (for dev).
const dbConfig = {
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  port: Number(process.env.MYSQLPORT || process.env.DB_PORT) || 3306,
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'github_analyzer'
};

console.log(
  `[db] Connecting → host=${dbConfig.host} port=${dbConfig.port} user=${dbConfig.user} db=${dbConfig.database} hasPassword=${dbConfig.password ? 'yes' : 'NO'}`
);

const useSsl = String(process.env.DB_SSL || '').toLowerCase() === 'true';

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
