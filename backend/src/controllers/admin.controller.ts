import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../database/init';
import {
  getActiveElection,
  getElectionStats,
  openElection,
  closeElection,
  publishResults,
  getResults,
} from '../services/election.service';
import { logAudit } from '../services/audit.service';

// GET /api/admin/stats
export async function getAdminStats(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDatabase();
    const election = await getActiveElection();

    const totalVoters = await db.get<{ count: number }>(`SELECT COUNT(*) as count FROM users WHERE role = 'VOTER'`);
    const totalCandidates = election
      ? await db.get<{ count: number }>(`SELECT COUNT(*) as count FROM candidates WHERE election_id = ?`, election.id)
      : { count: 0 };

    let stats = { totalVoters: 0, votesIn: 0, participationRate: 0 };
    if (election) {
      stats = await getElectionStats(election.id);
    }

    res.json({
      success: true,
      data: {
        totalVoters: totalVoters?.count || 0,
        totalCandidates: totalCandidates?.count || 0,
        votesIn: stats.votesIn,
        participationRate: stats.participationRate,
        electionStatus: election?.status || 'NONE',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik' });
  }
}

// GET /api/admin/voters
export async function getVoters(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDatabase();
    const { status, search, page = '1', limit = '10' } = req.query;

    let query = `SELECT id, nim, name, has_voted, voted_at, created_at FROM users WHERE role = 'VOTER'`;
    const params: any[] = [];

    if (status === 'voted') {
      query += ' AND has_voted = 1';
    } else if (status === 'not_voted') {
      query += ' AND has_voted = 0';
    }

    if (search && typeof search === 'string') {
      query += ' AND (nim LIKE ? OR name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Count total
    const countQuery = query.replace('SELECT id, nim, name, has_voted, voted_at, created_at', 'SELECT COUNT(*) as count');
    const totalResult = await db.get<{ count: number }>(countQuery, ...params);
    const totalCount = totalResult?.count || 0;

    // Paginate
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const offset = (pageNum - 1) * limitNum;
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const voters = await db.all<any[]>(query, ...params);

    res.json({
      success: true,
      data: {
        voters,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data pemilih' });
  }
}

// POST /api/admin/voters
export async function createVoter(req: Request, res: Response): Promise<void> {
  try {
    const { nim, name, password } = req.body;

    if (!nim || !name || !password) {
      res.status(400).json({ success: false, message: 'NIM, nama, dan password wajib diisi' });
      return;
    }

    const db = await getDatabase();

    // Check if NIM already exists
    const existing = await db.get('SELECT id FROM users WHERE nim = ?', nim);
    if (existing) {
      res.status(409).json({ success: false, message: 'NIM sudah terdaftar' });
      return;
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    await db.run(`INSERT INTO users (nim, name, password, role) VALUES (?, ?, ?, 'VOTER')`, nim, name, hashedPassword);

    await logAudit('VOTER_CREATED', req.user?.id, { nim, name }, req.ip);

    res.status(201).json({
      success: true,
      data: { message: 'Pemilih berhasil ditambahkan' },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal menambahkan pemilih' });
  }
}

// GET /api/admin/candidates
export async function getAdminCandidates(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDatabase();
    const election = await getActiveElection();

    if (!election) {
      res.json({ success: true, data: [] });
      return;
    }

    const candidates = await db.all<any[]>(`
      SELECT * FROM candidates WHERE election_id = ? ORDER BY order_number ASC
    `, election.id);

    res.json({ success: true, data: candidates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data kandidat' });
  }
}

// POST /api/admin/candidates
export async function createCandidate(req: Request, res: Response): Promise<void> {
  try {
    const { orderNumber, name, currentRole, tagline, vision, mission, experience, photoUrl } = req.body;

    if (!name || !currentRole || !vision || !mission || !experience) {
      res.status(400).json({ success: false, message: 'Data kandidat tidak lengkap' });
      return;
    }

    const db = await getDatabase();
    const election = await getActiveElection();

    if (!election) {
      res.status(400).json({ success: false, message: 'Tidak ada pemilihan yang tersedia' });
      return;
    }

    if (election.status !== 'PENDING') {
      res.status(400).json({ success: false, message: 'Kandidat hanya bisa ditambahkan saat status PENDING' });
      return;
    }

    await db.run(`
      INSERT INTO candidates (election_id, order_number, name, current_role, tagline, vision, mission, experience, photo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, election.id, orderNumber || 0, name, currentRole, tagline || '', vision, mission, experience, photoUrl || null);

    await logAudit('CANDIDATE_CREATED', req.user?.id, { name }, req.ip);

    res.status(201).json({
      success: true,
      data: { message: 'Kandidat berhasil ditambahkan' },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal menambahkan kandidat' });
  }
}

// PUT /api/admin/candidates/:id
export async function updateCandidate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { orderNumber, name, currentRole, tagline, vision, mission, experience, photoUrl } = req.body;

    const db = await getDatabase();
    const candidate = await db.get('SELECT * FROM candidates WHERE id = ?', id);

    if (!candidate) {
      res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan' });
      return;
    }

    await db.run(`
      UPDATE candidates SET order_number=?, name=?, current_role=?, tagline=?, vision=?, mission=?, experience=?, photo_url=?
      WHERE id=?
    `, orderNumber, name, currentRole, tagline, vision, mission, experience, photoUrl, id);

    await logAudit('CANDIDATE_UPDATED', req.user?.id, { candidateId: id, name }, req.ip);

    res.json({ success: true, data: { message: 'Kandidat berhasil diperbarui' } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui kandidat' });
  }
}

// DELETE /api/admin/candidates/:id
export async function deleteCandidate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const db = await getDatabase();

    const candidate = await db.get<any>('SELECT * FROM candidates WHERE id = ?', id);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan' });
      return;
    }

    // Check if election is still pending
    const election = await db.get<any>('SELECT status FROM elections WHERE id = ?', candidate.election_id);
    if (election && election.status !== 'PENDING') {
      res.status(400).json({ success: false, message: 'Tidak bisa menghapus kandidat setelah voting dimulai' });
      return;
    }

    await db.run('DELETE FROM candidates WHERE id = ?', id);
    await logAudit('CANDIDATE_DELETED', req.user?.id, { candidateId: id }, req.ip);

    res.json({ success: true, data: { message: 'Kandidat berhasil dihapus' } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus kandidat' });
  }
}

// GET /api/admin/election
export async function getAdminElection(req: Request, res: Response): Promise<void> {
  try {
    const election = await getActiveElection();
    if (!election) {
      res.status(404).json({ success: false, message: 'Tidak ada pemilihan' });
      return;
    }

    const stats = await getElectionStats(election.id);

    res.json({
      success: true,
      data: { ...election, stats },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data pemilihan' });
  }
}

// POST /api/admin/election
export async function createElection(req: Request, res: Response): Promise<void> {
  try {
    const { title, description, startDate, endDate } = req.body;

    if (!title || !startDate || !endDate) {
      res.status(400).json({ success: false, message: 'Data pemilihan tidak lengkap' });
      return;
    }

    const db = await getDatabase();
    await db.run(`
      INSERT INTO elections (title, description, start_date, end_date, status) 
      VALUES (?, ?, ?, ?, 'PENDING')
    `, title, description || '', startDate, endDate);

    await logAudit('ELECTION_CREATED', req.user?.id, { title }, req.ip);

    res.status(201).json({
      success: true,
      data: { message: 'Pemilihan berhasil dibuat' },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal membuat pemilihan' });
  }
}

// PUT /api/admin/election/:id
export async function updateElection(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, description, startDate, endDate } = req.body;

    const db = await getDatabase();
    await db.run(`
      UPDATE elections SET title=?, description=?, start_date=?, end_date=? WHERE id=?
    `, title, description, startDate, endDate, id);

    res.json({ success: true, data: { message: 'Pemilihan berhasil diperbarui' } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui pemilihan' });
  }
}

// PATCH /api/admin/election/open
export async function openElectionHandler(req: Request, res: Response): Promise<void> {
  try {
    const election = await getActiveElection();
    if (!election) {
      res.status(404).json({ success: false, message: 'Tidak ada pemilihan' });
      return;
    }

    const result = await openElection(election.id);
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    await logAudit('ELECTION_OPENED', req.user?.id, { electionId: election.id }, req.ip);

    res.json({ success: true, data: { message: result.message } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal membuka voting' });
  }
}

// PATCH /api/admin/election/close
export async function closeElectionHandler(req: Request, res: Response): Promise<void> {
  try {
    const election = await getActiveElection();
    if (!election) {
      res.status(404).json({ success: false, message: 'Tidak ada pemilihan' });
      return;
    }

    const result = await closeElection(election.id);
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    await logAudit('ELECTION_CLOSED', req.user?.id, { electionId: election.id, totalValidVotes: result.totalValidVotes }, req.ip);

    res.json({
      success: true,
      data: { message: result.message, totalValidVotes: result.totalValidVotes },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal menutup voting' });
  }
}

// GET /api/admin/results
export async function getAdminResults(req: Request, res: Response): Promise<void> {
  try {
    const election = await getActiveElection();
    if (!election) {
      res.status(404).json({ success: false, message: 'Tidak ada pemilihan' });
      return;
    }

    const results = await getResults(election.id);
    if (!results) {
      res.status(400).json({
        success: false,
        message: 'Hasil belum tersedia. Voting harus ditutup terlebih dahulu.',
      });
      return;
    }

    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil hasil' });
  }
}

// PATCH /api/admin/election/publish
export async function publishResultsHandler(req: Request, res: Response): Promise<void> {
  try {
    const election = await getActiveElection();
    if (!election) {
      res.status(404).json({ success: false, message: 'Tidak ada pemilihan' });
      return;
    }

    const result = await publishResults(election.id);
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    await logAudit('RESULTS_PUBLISHED', req.user?.id, { electionId: election.id }, req.ip);

    res.json({ success: true, data: { message: result.message } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal mempublikasikan hasil' });
  }
}

// GET /api/admin/participation-timeline
export async function getParticipationTimeline(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDatabase();
    const election = await getActiveElection();

    if (!election) {
      res.json({ success: true, data: [] });
      return;
    }

    const timeline = await db.all<any[]>(`
      SELECT 
        strftime('%Y-%m-%d %H:00:00', created_at) as hour,
        COUNT(*) as count
      FROM votes 
      WHERE election_id = ?
      GROUP BY hour
      ORDER BY hour ASC
    `, election.id);

    res.json({ success: true, data: timeline });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil timeline' });
  }
}
  
// PUT /api/admin/voters/:id  
export async function updateVoter(req: Request, res: Response): Promise<void> {  
  try {  
    const { id } = req.params;  
    const { nim, name, password } = req.body;  
    if (!nim || !name) { res.status(400).json({ success: false, message: 'NIM dan nama wajib diisi' }); return; }  
    const db = await getDatabase();  
    const voter = await db.get('SELECT * FROM users WHERE id = ? AND role = "VOTER"', id);  
    if (!voter) { res.status(404).json({ success: false, message: 'Pemilih tidak ditemukan' }); return; }  
    const existing = await db.get('SELECT id FROM users WHERE nim = ? AND id != ?', nim, id);  
    if (existing) { res.status(409).json({ success: false, message: 'NIM sudah terdaftar' }); return; }  
    if (password) { const hashedPassword = bcrypt.hashSync(password, 10); await db.run('UPDATE users SET nim=?, name=?, password=? WHERE id=?', nim, name, hashedPassword, id); } else { await db.run('UPDATE users SET nim=?, name=? WHERE id=?', nim, name, id); }  
    await logAudit('VOTER_UPDATED', req.user?.id, { voterId: id, nim, name }, req.ip);  
    res.json({ success: true, data: { message: 'Pemilih berhasil diperbarui' } });  
  } catch (error: any) { res.status(500).json({ success: false, message: 'Gagal memperbarui pemilih' }); }  
}  
// DELETE /api/admin/voters/:id  
export async function deleteVoter(req: Request, res: Response): Promise<void> {  
  try {  
    const { id } = req.params; const db = await getDatabase();  
    const voter = await db.get<any>('SELECT * FROM users WHERE id = ? AND role = "VOTER"', id);  
    if (!voter) { res.status(404).json({ success: false, message: 'Pemilih tidak ditemukan' }); return; }  
    if (voter.has_voted === 1) { res.status(400).json({ success: false, message: 'Tidak bisa menghapus pemilih yang sudah memberikan suara' }); return; }  
    await db.run('DELETE FROM users WHERE id = ?', id);  
    await logAudit('VOTER_DELETED', req.user?.id, { voterId: id }, req.ip);  
    res.json({ success: true, data: { message: 'Pemilih berhasil dihapus' } });  
  } catch (error: any) { res.status(500).json({ success: false, message: 'Gagal menghapus pemilih' }); }  
} 

// GET /api/admin/audit-logs
export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDatabase();
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const offset = (pageNum - 1) * limitNum;

    const countResult = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM audit_logs');
    const totalCount = countResult?.count || 0;

    const logs = await db.all<any[]>(`
      SELECT a.id, a.action, a.user_id, a.metadata, a.ip_address, a.created_at,
             u.name as user_name, u.role as user_role, u.nim as user_nim
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, limitNum, offset);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      },
    });
  } catch (error: any) {
    console.error('[AUDIT] Failed to fetch audit logs:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil log audit' });
  }
}
