import { getDatabase } from '../database/init';

export async function logAudit(
  action: string,
  userId?: string,
  metadata?: Record<string, any>,
  ipAddress?: string
): Promise<void> {
  try {
    const db = await getDatabase();
    await db.run(`
      INSERT INTO audit_logs (action, user_id, metadata, ip_address)
      VALUES (?, ?, ?, ?)
    `, action, userId || null, metadata ? JSON.stringify(metadata) : null, ipAddress || null);

    console.log(`[AUDIT] ${action}`, userId ? `by user ${userId}` : '', metadata ? JSON.stringify(metadata) : '');
  } catch (error) {
    console.error('[AUDIT] Failed to log audit:', error);
  }
}
