import ApiUsage from '../models/ApiUsage.js';

export const trackApiUsage = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api/ai') || req.path.includes('generate') || req.path.includes('evaluate')) {
      ApiUsage.create({
        endpoint: req.path,
        method: req.method,
        userId: req.user?._id,
        latencyMs: Date.now() - start,
        statusCode: res.statusCode,
      }).catch(() => {});
    }
  });
  next();
};
