import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const isVercel = process.env.VERCEL === '1';
const DB_PATH = isVercel ? '/tmp/database.db' : path.join(__dirname, '..', '..', 'database.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db: Database;

export async function getDatabase(): Promise<Database> {
  if (!db) {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    await db.exec('PRAGMA journal_mode = WAL');
    await db.exec('PRAGMA foreign_keys = ON');
    await db.exec('PRAGMA busy_timeout = 5000');
    console.log('[DB] Connected to SQLite database at', DB_PATH);
  }
  return db;
}

export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();

  // Read and execute schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  await database.exec(schema);
  console.log('[DB] Schema executed successfully');

  // Check if data already seeded
  const userCount = await database.get<{ count: number }>('SELECT COUNT(*) as count FROM users');
  if (userCount && userCount.count > 0) {
    console.log('[DB] Database already seeded, skipping...');
    return;
  }

  console.log('[DB] Seeding database...');

  const salt = bcrypt.genSaltSync(10);

  // Seed Admin user
  const adminPassword = bcrypt.hashSync('admin123', salt);
  await database.run(`
    INSERT INTO users (nim, name, password, role) 
    VALUES (?, ?, ?, ?)
  `, 'ADMIN001', 'Administrator', adminPassword, 'ADMIN');
  console.log('[DB] Admin user created: ADMIN001');

  // Seed 5 Voter users
  const voterPassword = bcrypt.hashSync('voter123', salt);
  const voters = [
    { nim: '2021001', name: 'Ahmad Rizki Pratama' },
    { nim: '2021002', name: 'Siti Nurhaliza Putri' },
    { nim: '2021003', name: 'Muhammad Fajar Hidayat' },
    { nim: '2021004', name: 'Dewi Anggraini Sari' },
    { nim: '2021005', name: 'Budi Santoso Wijaya' },
  ];

  for (const voter of voters) {
    await database.run(`
      INSERT INTO users (nim, name, password, role) 
      VALUES (?, ?, ?, 'VOTER')
    `, voter.nim, voter.name, voterPassword);
  }
  console.log('[DB] 5 voter users created');

  // Seed Election
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 19).replace('T', ' ');
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString().slice(0, 19).replace('T', ' ');

  await database.run(`
    INSERT INTO elections (id, title, description, start_date, end_date, status)
    VALUES (?, ?, ?, ?, ?, 'PENDING')
  `, 
    'election-001',
    'Pemilihan Ketua BEM Universitas 2024-2025',
    'Pemilihan demokratis untuk memilih ketua BEM periode 2024-2025. Gunakan hak suara Anda dengan bijak untuk memilih pemimpin yang akan membawa perubahan positif bagi mahasiswa.',
    startDate,
    endDate
  );
  console.log('[DB] Election created');

  // Seed 3 Candidates
  const candidates = [
    {
      order_number: 1,
      name: 'Andi Wijaya Kusuma',
      current_role: 'Ketua Himpunan Mahasiswa Teknik Informatika',
      tagline: 'Bersama Membangun Kampus yang Lebih Baik',
      vision: 'Mewujudkan BEM yang transparan, inovatif, dan berpihak pada kepentingan seluruh mahasiswa melalui program kerja berbasis teknologi dan kolaborasi lintas fakultas.',
      mission: '1. Membangun sistem informasi terpadu untuk seluruh kegiatan kemahasiswaan\n2. Meningkatkan kualitas akademik melalui program mentoring dan workshop\n3. Memperkuat advokasi hak-hak mahasiswa secara berkelanjutan\n4. Mengembangkan program beasiswa dan bantuan dana mahasiswa\n5. Membangun jejaring alumni untuk mendukung karir mahasiswa',
      experience: '1. Ketua Himpunan Mahasiswa Teknik Informatika 2023-2024\n2. Koordinator Divisi Teknologi BEM 2022-2023\n3. Ketua Panitia Dies Natalis Universitas ke-25\n4. Peserta Program Pertukaran Mahasiswa ASEAN 2023\n5. Juara 1 Hackathon Nasional 2023',
      photo_url: null,
    },
    {
      order_number: 2,
      name: 'Putri Rahayu Ningrum',
      current_role: 'Sekretaris Jenderal BEM Fakultas Ekonomi',
      tagline: 'Suara Mahasiswa, Aksi Nyata',
      vision: 'Menciptakan ekosistem kampus yang inklusif, berkeadilan, dan mendorong prestasi mahasiswa di tingkat nasional maupun internasional.',
      mission: '1. Memperjuangkan kesetaraan akses pendidikan bagi seluruh mahasiswa\n2. Mendirikan pusat kreativitas dan inovasi mahasiswa\n3. Meningkatkan keterlibatan mahasiswa dalam pengambilan kebijakan kampus\n4. Mengoptimalkan unit kegiatan mahasiswa sebagai wadah pengembangan bakat\n5. Membangun kerjasama strategis dengan organisasi mahasiswa se-Indonesia',
      experience: '1. Sekretaris Jenderal BEM Fakultas Ekonomi 2023-2024\n2. Koordinator Program Bakti Sosial Universitas 2023\n3. Delegasi Indonesia di Model United Nations Asia Pacific 2023\n4. Pendiri Komunitas Literasi Kampus "Aksara Muda"\n5. Penerima Beasiswa Unggulan Kemendikbud 2022',
      photo_url: null,
    },
    {
      order_number: 3,
      name: 'Rizal Firmansyah Putra',
      current_role: 'Ketua Dewan Perwakilan Mahasiswa',
      tagline: 'Kolaborasi untuk Perubahan',
      vision: 'Membangun organisasi kemahasiswaan yang profesional, akuntabel, dan mampu menjadi motor penggerak perubahan sosial di lingkungan kampus dan masyarakat.',
      mission: '1. Reformasi birokrasi organisasi kemahasiswaan agar lebih efisien\n2. Mendorong riset dan publikasi ilmiah mahasiswa\n3. Memfasilitasi program magang dan kewirausahaan mahasiswa\n4. Meningkatkan kesejahteraan mahasiswa melalui program bantuan\n5. Menjalin kemitraan dengan industri untuk peningkatan kompetensi',
      experience: '1. Ketua Dewan Perwakilan Mahasiswa 2023-2024\n2. Wakil Ketua BEM Fakultas Hukum 2022-2023\n3. Koordinator Relawan Bencana Nasional Universitas 2023\n4. Finalis Kompetisi Debat Konstitusi Nasional 2023\n5. Ketua Tim Advokasi Mahasiswa untuk Kebijakan Kampus',
      photo_url: null,
    },
  ];

  for (const c of candidates) {
    await database.run(`
      INSERT INTO candidates (election_id, order_number, name, current_role, tagline, vision, mission, experience, photo_url)
      VALUES ('election-001', ?, ?, ?, ?, ?, ?, ?, ?)
    `, c.order_number, c.name, c.current_role, c.tagline, c.vision, c.mission, c.experience, c.photo_url);
  }
  console.log('[DB] 3 candidates created');

  console.log('[DB] Database seeding complete!');
}
