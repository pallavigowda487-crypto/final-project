const SENSITIVE_KEYS = ['password', 'token', 'apiKey', 'api_key', 'secret', 'authorization'];

export const maskSensitive = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const masked = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(masked)) {
    if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))) {
      masked[key] = '***MASKED***';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitive(masked[key]);
    }
  }
  return masked;
};
