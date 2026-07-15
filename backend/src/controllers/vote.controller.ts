import { Request, Response } from 'express';
import { submitVote, getVoteReceipt } from '../services/vote.service';

export async function castVote(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Autentikasi diperlukan' });
      return;
    }

    const { ciphertext, iv, rsaSignature, encryptedAesKey, electionId } = req.body;

    if (!ciphertext || !iv || !rsaSignature || !encryptedAesKey || !electionId) {
      res.status(400).json({
        success: false,
        message: 'Data voting tidak lengkap',
      });
      return;
    }

    console.log('[VOTE] ═══════════════════════════════════════');
    console.log('[VOTE] Vote submission started');
    console.log('[VOTE] Voter ID:', userId);
    console.log('[VOTE] Election ID:', electionId);
    console.log('[VOTE] Encrypted AES Key length:', encryptedAesKey.length, 'chars');
    console.log('[VOTE] Ciphertext length:', ciphertext.length, 'chars');
    console.log('[VOTE] IV:', iv);
    console.log('[VOTE] RSA Signature length:', rsaSignature.length, 'chars');
    console.log('[VOTE] ═══════════════════════════════════════');

    const result = await submitVote(userId, {
      ciphertext,
      iv,
      rsaSignature,
      encryptedAesKey,
      electionId,
    }, req.ip);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        verificationCode: result.verificationCode,
      },
      message: result.message,
    });
  } catch (error: any) {
    console.error('[VOTE] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memproses suara',
    });
  }
}

export async function getMyReceipt(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Autentikasi diperlukan' });
      return;
    }

    const receipt = await getVoteReceipt(userId);
    if (!receipt) {
      res.status(404).json({
        success: false,
        message: 'Anda belum memberikan suara',
      });
      return;
    }

    res.json({
      success: true,
      data: receipt,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil bukti voting',
    });
  }
}
