import { Request, Response } from 'express';
import { getDatabase } from '../database/init';

export async function getCandidates(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDatabase();
    const election = await db.get<any>(`SELECT * FROM elections ORDER BY created_at DESC LIMIT 1`);
    
    if (!election) {
      res.json({ success: true, data: [] });
      return;
    }

    const candidates = await db.all<any[]>(`
      SELECT id, election_id, order_number, name, current_role, tagline, vision, mission, experience, photo_url, created_at
      FROM candidates 
      WHERE election_id = ?
      ORDER BY order_number ASC
    `, election.id);

    res.json({
      success: true,
      data: candidates,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kandidat',
    });
  }
}

export async function getCandidateById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const db = await getDatabase();

    const candidate = await db.get<any>(`
      SELECT id, election_id, order_number, name, current_role, tagline, vision, mission, experience, photo_url, created_at
      FROM candidates WHERE id = ?
    `, id);

    if (!candidate) {
      res.status(404).json({
        success: false,
        message: 'Kandidat tidak ditemukan',
      });
      return;
    }

    res.json({
      success: true,
      data: candidate,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kandidat',
    });
  }
}
