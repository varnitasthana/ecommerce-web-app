const sanitize = (target) => {
  if (!target || typeof target !== 'object') return target;
  
  if (Array.isArray(target)) {
    return target.map(sanitize);
  }
  
  const result = {};
  for (const [key, value] of Object.entries(target)) {
    if (key.startsWith('$')) continue;
    result[key] = sanitize(value);
  }
  return result;
};

const mongoSanitize = (req, res, next) => {
  try {
    if (req.body) {
      req.body = sanitize(req.body);
    }
    if (req.params) {
      req.params = sanitize(req.params);
    }
    if (req.headers) {
      const sanitizedHeaders = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (!key.startsWith('$')) {
          sanitizedHeaders[key] = value;
        }
      }
      req.headers = sanitizedHeaders;
    }
  } catch (error) {
    return res.status(400).json({ message: 'Invalid request data' });
  }
  next();
};

module.exports = mongoSanitize;
