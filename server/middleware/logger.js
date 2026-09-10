const morgan = require('morgan');

const requestLogger = morgan((tokens, req, res) => {
  const requestId = req.id || 'req_unknown';
  return [
    `requestId=${requestId}`,
    `method=${tokens.method(req, res)}`,
    `url=${tokens.url(req, res)}`,
    `status=${tokens.status(req, res)}`,
    `content_length=${tokens.res(req, res, 'content-length') || '-'}`,
    `response_time=${tokens['response-time'](req, res)}ms`,
    `remote_addr=${tokens['remote-addr'](req, res)}`
  ].join(' ');
});

const logger = {
  info: (...args) => console.log(`[INFO] ${new Date().toISOString()}:`, ...args),
  warn: (...args) => console.warn(`[WARN] ${new Date().toISOString()}:`, ...args),
  error: (...args) => console.error(`[ERROR] ${new Date().toISOString()}:`, ...args),
  debug: (...args) => {
    if (process.env.DEBUG) {
      console.debug(`[DEBUG] ${new Date().toISOString()}:`, ...args);
    }
  }
};

module.exports = {
  requestLogger,
  logger
};
