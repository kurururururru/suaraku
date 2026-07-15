import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase } from './database/init';

// Import routes
import authRoutes from './routes/auth.routes';
import voteRoutes from './routes/vote.routes';
import candidateRoutes from './routes/candidate.routes';
import electionRoutes from './routes/election.routes';
import adminRoutes from './routes/admin.routes';
import configRoutes from './routes/config.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Lazy database initialization middleware for Vercel Serverless
let dbInitialized = false;
app.use(async (_req, res, next) => {
  if (!dbInitialized) {
    try {
      await initializeDatabase();
      console.log('[DB] Database initialized successfully');
      dbInitialized = true;
    } catch (error) {
      console.error('[DB] Failed to initialize database:', error);
      res.status(500).json({ success: false, message: 'Database initialization failed' });
      return;
    }
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/election', electionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/config', configRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'OK', timestamp: new Date().toISOString() } });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server only if not running on Vercel
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════');
    console.log('  SuaraKu E-Voting System - Backend');
    console.log(`  Server running on http://localhost:${PORT}`);
    console.log('  Crypto: AES-GCM + HMAC-SHA256 + RSA-PSS');
    console.log('═══════════════════════════════════════════');
  });
}

export default app;


