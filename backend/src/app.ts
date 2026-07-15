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
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
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

// Initialize database and start server
(async () => {
  try {
    await initializeDatabase();
    console.log('[DB] Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log('═══════════════════════════════════════════');
      console.log('  SuaraKu E-Voting System - Backend');
      console.log(`  Server running on http://localhost:${PORT}`);
      console.log('  Crypto: AES-GCM + HMAC-SHA256 + RSA-PSS');
      console.log('═══════════════════════════════════════════');
    });
  } catch (error) {
    console.error('[DB] Failed to initialize database:', error);
    process.exit(1);
  }
})();

export default app;


