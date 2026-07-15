import rateLimit from 'express-rate-limit';

// Rate limit for login: max 5 requests per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.',
    code: 'RATE_LIMIT_LOGIN',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for voting: max 3 requests per hour per IP
export const voteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan voting. Silakan coba lagi nanti.',
    code: 'RATE_LIMIT_VOTE',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
