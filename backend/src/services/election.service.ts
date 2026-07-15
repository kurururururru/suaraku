import { getDatabase } from '../database/init';
import { verifyHMAC, decryptAES } from '../modules/crypto';

export interface ElectionData {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export async function getActiveElection(): Promise<ElectionData | null> {
  const db = await getDatabase();
  const election = await db.get<ElectionData>(`
    SELECT * FROM elections 
    ORDER BY created_at DESC 
    LIMIT 1
  `);

  return election || null;
}

export async function getElectionStats(electionId: string) {
  const db = await getDatabase();

  const totalVoters = await db.get<{ count: number }>(
    `SELECT COUNT(*) as count FROM users WHERE role = 'VOTER'`
  );

  const votesIn = await db.get<{ count: number }>(
    `SELECT COUNT(*) as count FROM votes WHERE election_id = ?`,
    electionId
  );

  const participationRate = totalVoters && totalVoters.count > 0
    ? Math.round(((votesIn?.count || 0) / totalVoters.count) * 100)
    : 0;

  return {
    totalVoters: totalVoters?.count || 0,
    votesIn: votesIn?.count || 0,
    participationRate,
  };
}

export async function openElection(electionId: string): Promise<{ success: boolean; message: string }> {
  const db = await getDatabase();

  const election = await db.get<ElectionData>('SELECT * FROM elections WHERE id = ?', electionId);
  if (!election) return { success: false, message: 'Pemilihan tidak ditemukan' };
  if (election.status !== 'PENDING') return { success: false, message: 'Pemilihan hanya bisa dibuka dari status PENDING' };

  const candidateCount = await db.get<{ count: number }>(
    'SELECT COUNT(*) as count FROM candidates WHERE election_id = ?',
    electionId
  );

  if (!candidateCount || candidateCount.count === 0) {
    return { success: false, message: 'Tidak bisa membuka voting tanpa kandidat' };
  }

  await db.run('UPDATE elections SET status = ? WHERE id = ?', 'ACTIVE', electionId);

  return { success: true, message: 'Voting berhasil dibuka' };
}

export async function closeElection(electionId: string): Promise<{ success: boolean; message: string; totalValidVotes?: number }> {
  const db = await getDatabase();

  const election = await db.get<ElectionData>('SELECT * FROM elections WHERE id = ?', electionId);
  if (!election) return { success: false, message: 'Pemilihan tidak ditemukan' };
  if (election.status !== 'ACTIVE') return { success: false, message: 'Hanya pemilihan yang aktif yang bisa ditutup' };

  // Verify all vote HMACs for integrity
  const votes = await db.all<any[]>('SELECT * FROM votes WHERE election_id = ?', electionId);

  let validCount = 0;
  for (const vote of votes) {
    const hmacData = vote.encrypted_payload + vote.iv + vote.voter_id + vote.election_id;
    console.log('[DEBUG-ELECTION] hmacData length:', hmacData.length, 'preview:', hmacData.substring(0, 50));
    const isValid = verifyHMAC(hmacData, vote.hmac_signature);
    if (isValid) {
      validCount++;
    } else {
      await db.run('UPDATE votes SET is_valid = 0 WHERE id = ?', vote.id);
      console.log(`[SECURITY] Vote ${vote.id} HMAC verification FAILED`);
    }
  }

  await db.run('UPDATE elections SET status = ? WHERE id = ?', 'CLOSED', electionId);

  console.log(`[ELECTION] Voting closed. ${validCount}/${votes.length} votes valid.`);

  return { success: true, message: 'Voting berhasil ditutup', totalValidVotes: validCount };
}

export async function publishResults(electionId: string): Promise<{ success: boolean; message: string }> {
  const db = await getDatabase();
  const election = await db.get<ElectionData>('SELECT * FROM elections WHERE id = ?', electionId);
  if (!election) return { success: false, message: 'Pemilihan tidak ditemukan' };
  if (election.status !== 'CLOSED') return { success: false, message: 'Hasil hanya bisa dipublikasikan setelah voting ditutup' };

  await db.run('UPDATE elections SET status = ? WHERE id = ?', 'RESULTS_PUBLISHED', electionId);

  return { success: true, message: 'Hasil berhasil dipublikasikan' };
}

export async function getResults(electionId: string) {
  const db = await getDatabase();

  const election = await db.get<ElectionData>('SELECT * FROM elections WHERE id = ?', electionId);
  if (!election) return null;
  if (election.status !== 'CLOSED' && election.status !== 'RESULTS_PUBLISHED') return null;

  const stats = await getElectionStats(electionId);

  // First fetch all candidates
  const candidatesRows = await db.all<any[]>(`
    SELECT id, name, order_number, photo_url
    FROM candidates
    WHERE election_id = ?
  `, electionId);

  // Initialize tally map
  const tally: Record<string, number> = {};
  candidatesRows.forEach(c => tally[c.id] = 0);

  // Fetch all valid votes
  const votes = await db.all<any[]>(`
    SELECT encrypted_payload, iv
    FROM votes
    WHERE election_id = ? AND is_valid = 1
  `, electionId);

  // Tally by decrypting each vote
  let totalVotes = 0;
  for (const vote of votes) {
    try {
      const decryptedStr = decryptAES(vote.encrypted_payload, vote.iv);
      const payload = JSON.parse(decryptedStr);
      if (payload.candidateId && tally[payload.candidateId] !== undefined) {
        tally[payload.candidateId]++;
        totalVotes++;
      }
    } catch (err) {
      console.error('[ELECTION] Failed to decrypt vote payload during tallying', err);
    }
  }

  const candidatesWithPercentage = candidatesRows.map((c: any) => ({
    id: c.id,
    name: c.name,
    orderNumber: c.order_number,
    photoUrl: c.photo_url,
    voteCount: tally[c.id],
    percentage: totalVotes > 0 ? Math.round((tally[c.id] / totalVotes) * 10000) / 100 : 0,
  }));

  // Sort by voteCount descending
  candidatesWithPercentage.sort((a, b) => b.voteCount - a.voteCount);

  const winner = candidatesWithPercentage.length > 0 && candidatesWithPercentage[0].voteCount > 0 
    ? candidatesWithPercentage[0] : null;

  return {
    election: {
      title: election.title,
      totalVoters: stats.totalVoters,
      votesIn: stats.votesIn,
      participationRate: stats.participationRate,
    },
    candidates: candidatesWithPercentage,
    winner,
  };
}
