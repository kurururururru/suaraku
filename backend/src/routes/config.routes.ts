import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/config/crypto
router.get('/crypto', (req: Request, res: Response) => {
  const publicKey = process.env.SERVER_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(500).json({ success: false, message: 'Server public key is not configured' });
  }

  // Restore newlines that were escaped in .env
  const formattedKey = publicKey.replace(/\\n/g, '\n');

  res.json({
    success: true,
    data: {
      serverPublicKey: formattedKey
    }
  });
});

export default router;
