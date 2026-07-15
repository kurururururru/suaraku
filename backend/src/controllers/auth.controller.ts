import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../database/init';
import { logAudit } from '../services/audit.service';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { nim, password } = req.body;

    if (!nim || !password) {
      res.status(400).json({
        success: false,
        message: 'NIM dan password wajib diisi',
      });
      return;
    }

    const db = await getDatabase();
    const user = await db.get<any>('SELECT * FROM users WHERE nim = ?', nim);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'NIM atau password salah',
      });
      return;
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'NIM atau password salah',
      });
      return;
    }

    const secret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(
      { id: user.id, nim: user.nim, name: user.name, role: user.role },
      secret,
      { expiresIn: '24h' }
    );

    // we don't need to await logAudit if we don't want to block, but it's safe to await it
    await logAudit('USER_LOGIN', user.id, { nim: user.nim, role: user.role }, req.ip);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          hasVoted: user.has_voted === 1,
          hasPublicKey: !!user.public_key,
        },
      },
    });
  } catch (error: any) {
    console.error('[AUTH] Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
    });
  }
}

export async function registerKey(req: Request, res: Response): Promise<void> {
  try {
    const { publicKey } = req.body;
    const userId = req.user?.id;

    if (!publicKey) {
      res.status(400).json({
        success: false,
        message: 'Public key wajib diisi',
      });
      return;
    }

    const db = await getDatabase();
    
    // Security Fix: Prevent overwriting an existing public key IF user has already voted
    const user = await db.get<any>('SELECT public_key, has_voted FROM users WHERE id = ?', userId);
    if (user && user.public_key && user.has_voted === 1) {
      res.status(403).json({
        success: false,
        message: 'Kunci publik sudah terdaftar dan Anda telah memberikan suara. Tidak dapat menimpa kunci.',
      });
      return;
    }
    await db.run('UPDATE users SET public_key = ? WHERE id = ?', publicKey, userId);

    await logAudit('PUBLIC_KEY_REGISTERED', userId, {}, req.ip);
    console.log('[AUTH] RSA public key registered for user:', userId);

    res.json({
      success: true,
      data: { message: 'Kunci publik berhasil didaftarkan' },
    });
  } catch (error: any) {
    console.error('[AUTH] Register key error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mendaftarkan kunci publik',
    });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const db = await getDatabase();
    const user = await db.get<any>('SELECT id, nim, name, role, has_voted, voted_at, public_key FROM users WHERE id = ?', userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        nim: user.nim,
        name: user.name,
        role: user.role,
        hasVoted: user.has_voted === 1,
        votedAt: user.voted_at,
        hasPublicKey: !!user.public_key,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
    });
  }
}
