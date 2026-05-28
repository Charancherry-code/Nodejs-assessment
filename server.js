require('dotenv').config();

const app = require('./src/app');
const { ensureSchema } = require('./src/config/db');

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await ensureSchema();
    app.listen(PORT, () => {
      console.log(`GitHub Profile Analyzer running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    if (err.code) console.error('  code:', err.code);
    if (err.errno) console.error('  errno:', err.errno);
    if (err.sqlState) console.error('  sqlState:', err.sqlState);
    process.exit(1);
  }
})();
