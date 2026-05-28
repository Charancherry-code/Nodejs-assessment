/**
 * Creates the database (if it doesn't exist) and the required tables.
 * Run with: npm run db:init
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const cfg = {
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  port: Number(process.env.MYSQLPORT || process.env.DB_PORT) || 3306,
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'github_analyzer'
};

(async () => {
  const conn = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    multipleStatements: true,
    ssl: String(process.env.DB_SSL || '').toLowerCase() === 'true'
      ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
      : undefined
  });

  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${cfg.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await conn.query(`USE \`${cfg.database}\`;`);
    await conn.query(`
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
    `);

    console.log(`Database '${cfg.database}' and table 'profiles' are ready.`);
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
})();
