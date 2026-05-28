const { pool } = require('../config/db');

const SELECT_LIST_FIELDS = `
  id, github_id, username, name, avatar_url, html_url, location,
  public_repos, followers, following, total_stars, top_language,
  account_age_days, last_analyzed_at, created_at, updated_at
`;

/**
 * Insert or update a profile snapshot. Returns the persisted record.
 */
async function upsertProfile(payload) {
  const columns = Object.keys(payload);
  const placeholders = columns.map(() => '?').join(', ');
  const updateClause = columns
    .filter((c) => c !== 'github_id' && c !== 'username')
    .map((c) => `${c} = VALUES(${c})`)
    .join(', ');

  const sql = `
    INSERT INTO profiles (${columns.join(', ')}, last_analyzed_at)
    VALUES (${placeholders}, CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE ${updateClause}, last_analyzed_at = CURRENT_TIMESTAMP
  `;

  const values = columns.map((c) => {
    const value = payload[c];
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      return JSON.stringify(value);
    }
    return value;
  });

  await pool.execute(sql, values);
  return findByUsername(payload.username);
}

async function findByUsername(username) {
  const [rows] = await pool.execute('SELECT * FROM profiles WHERE username = ? LIMIT 1', [username]);
  return rows[0] || null;
}

async function findAll({ limit = 50, offset = 0, sort = 'last_analyzed_at', order = 'DESC' } = {}) {
  const allowedSort = ['last_analyzed_at', 'followers', 'total_stars', 'public_repos', 'username', 'created_at'];
  const allowedOrder = ['ASC', 'DESC'];
  const safeSort = allowedSort.includes(sort) ? sort : 'last_analyzed_at';
  const safeOrder = allowedOrder.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
  const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

  const [rows] = await pool.query(
    `SELECT ${SELECT_LIST_FIELDS} FROM profiles ORDER BY ${safeSort} ${safeOrder} LIMIT ? OFFSET ?`,
    [safeLimit, safeOffset]
  );
  const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM profiles');
  return { items: rows, total: countRows[0].total, limit: safeLimit, offset: safeOffset };
}

async function deleteByUsername(username) {
  const [result] = await pool.execute('DELETE FROM profiles WHERE username = ?', [username]);
  return result.affectedRows > 0;
}

module.exports = { upsertProfile, findByUsername, findAll, deleteByUsername };
