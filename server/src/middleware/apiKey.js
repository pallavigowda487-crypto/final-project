export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!process.env.API_KEY) {
    return next();
  }
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(403).json({ success: false, message: 'Invalid API key' });
  }
  next();
};
