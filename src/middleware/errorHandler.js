/* eslint-disable no-unused-vars */
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const payload = {
    success: false,
    error: err.message || 'Internal Server Error'
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    payload.stack = err.stack;
  }

  if (status >= 500) {
    console.error('[ERROR]', err);
  }

  res.status(status).json(payload);
}

module.exports = errorHandler;
