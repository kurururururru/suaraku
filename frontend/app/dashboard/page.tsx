'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { Election } from '../../types/election';
import { generateRSAKeyPair } from '../../lib/crypto';
import { useRouter } from 'next/navigation';

export default function VoterDashboardPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [election, setElection] = useState<Election | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyGenerating, setKeyGenerating] = useState(false);
  const registeringRef = React.useRef(false);

  useEffect(() => {
    if (authLoading || !user) return;

    const initDashboard = async () => {
      try {
        setLoading(true);
        // 1. Check and register public key if needed (Only if not already voted)
        const privateKey = typeof window !== 'undefined' ? sessionStorage.getItem('rsa_private_key') : null;
        if ((!user.hasPublicKey || !privateKey) && !user.hasVoted && !registeringRef.current) {
          registeringRef.current = true;
          setKeyGenerating(true);
          const { publicKeyPem } = await generateRSAKeyPair();
          try {
            await api.post('/auth/register-key', { publicKey: publicKeyPem });
            await refreshUser();
          } catch (e: any) {
             // If another strict-mode call already registered it, ignore the 403
             if (e.response?.status !== 403) throw e;
          }
          setKeyGenerating(false);
        }

        // 2. Fetch election data
        const electionRes = await api.get('/election/active');
        if (electionRes.data.success && electionRes.data.data) {
          setElection(electionRes.data.data);
        }
      } catch (err) {
        console.error(err);
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || 'Gagal memuat data pemilihan.');
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, [user, authLoading, refreshUser]);

  if (authLoading || !user || keyGenerating || loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-on-surface-variant mt-4 font-medium">
            {keyGenerating ? 'Menyiapkan enkripsi keamanan Anda...' : 'Memuat dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-container-padding max-w-[1200px] mx-auto mt-8">
         <div className="bg-error-container border border-error/20 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-4">error</span>
          <h2 className="text-lg font-bold text-on-error-container mb-2">Terjadi Kesalahan</h2>
          <p className="text-on-error-container/80">{error}</p>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="p-container-padding max-w-[1200px] mx-auto mt-8">
        <div className="bg-surface-container-lowest border border-outline-variant p-12 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm">
          <span className="material-symbols-outlined text-[64px] text-outline mb-6">calendar_month</span>
          <h2 className="font-h2 text-h2 text-on-surface mb-2">Belum Ada Pemilihan</h2>
          <p className="text-on-surface-variant max-w-md">Saat ini tidak ada pemilihan yang sedang aktif. Silakan kembali lagi nanti saat pemilihan telah dibuka oleh administrator.</p>
        </div>
      </div>
    );
  }

  const isResultsPublished = election.status === 'RESULTS_PUBLISHED';
  const hasVoted = user.hasVoted;

  return (
    <div className="p-container-padding max-w-[1200px] mx-auto space-y-section-gap">
      {/* 1. Alert Banner */}
      {election.status === 'ACTIVE' && (
        <div className="relative overflow-hidden bg-[#FFFBEB] border border-amber-200 rounded-xl p-6 flex flex-col md:flex-row items-center gap-4 shadow-sm">
          <div className="bg-amber-100 p-3 rounded-lg text-amber-600">
            <span className="material-symbols-outlined text-[32px]">campaign</span>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-h3 text-h3 text-amber-900">Masa Voting Berlangsung</h3>
            <p className="font-body text-amber-800">Partisipasi Anda menentukan masa depan organisasi. Segera berikan suara Anda sebelum periode berakhir.</p>
          </div>
          <div className="bg-white/50 px-4 py-2 rounded-lg border border-amber-200 text-center">
            <span className="font-body-bold text-amber-900 block text-sm">
              {new Date(election.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(election.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-display text-primary">Selamat Datang, {user.name.split(' ')[0]}</h2>
          <p className="font-body text-on-surface-variant">Berikut adalah ringkasan status pemilihan Anda saat ini.</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full font-label text-label uppercase tracking-wider ${election.status === 'ACTIVE' ? 'bg-amber-100 text-amber-800' : 'bg-surface-container-high text-on-surface-variant'}`}>
          {election.status === 'ACTIVE' && <span className="w-2 h-2 bg-amber-600 rounded-full animate-pulse"></span>}
          {election.status === 'ACTIVE' ? 'Voting Berlangsung' : election.status}
        </div>
      </div>

      {/* 2. Stats Row (Custom for Voter) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {/* Card 1: Status Vote */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:border-primary/30 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <p className="font-label text-label text-on-surface-variant uppercase tracking-wider">Status Suara</p>
            <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">
              {hasVoted ? 'how_to_reg' : 'how_to_vote'}
            </span>
          </div>
          <p className="font-display text-display leading-none mb-1 text-primary">
            {hasVoted ? 'Sudah Memilih' : 'Belum Memilih'}
          </p>
          <p className="font-caption text-caption text-on-surface-variant flex items-center gap-1">
            {hasVoted ? 'Hak suara telah digunakan' : 'Silakan gunakan hak suara Anda'}
          </p>
        </div>

        {/* Card 2: Enkripsi */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:border-primary/30 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <p className="font-label text-label text-on-surface-variant uppercase tracking-wider">Status Keamanan</p>
            <span className="material-symbols-outlined text-secondary group-hover:scale-110 transition-transform">enhanced_encryption</span>
          </div>
          <p className="font-display text-display leading-none mb-1 text-secondary">
            {user.hasPublicKey ? 'Terlindungi' : 'Memproses'}
          </p>
          <p className="font-caption text-caption text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            <span>Enkripsi End-to-End Aktif</span>
          </p>
        </div>

        {/* Card 3: Sisa Waktu / Periode */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:border-primary/30 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <p className="font-label text-label text-on-surface-variant uppercase tracking-wider">Tenggat Waktu</p>
            <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">schedule</span>
          </div>
          <div className="flex items-end gap-2 mb-3">
             <p className="font-h2 text-h2 leading-none text-on-surface">
              {new Date(election.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
             </p>
          </div>
          <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
             <div className="bg-primary h-full transition-all duration-1000 ease-out w-full"></div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* 3. Voting Status Card */}
        <div className="col-span-12 lg:col-span-7 bg-primary-container text-white p-8 rounded-2xl shadow-lg relative overflow-hidden group flex flex-col justify-center">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
          <div className="relative z-10 space-y-6">
            {!hasVoted ? (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full font-label text-label uppercase tracking-widest backdrop-blur-sm">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    Status: Belum Memilih
                </div>
                <div className="max-w-md">
                    <h2 className="font-display text-display mb-4">Anda belum memberikan suara</h2>
                    <p className="font-body opacity-90 text-[16px] mb-8">Setiap suara sangat berharga. Luangkan waktu sejenak untuk meninjau visi-misi kandidat dan gunakan hak pilih Anda secara bijaksana.</p>
                    <button 
                      onClick={() => router.push('/dashboard/kandidat')}
                      className="bg-white text-primary font-body-bold px-8 py-4 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3"
                    >
                        <span>Lihat Kandidat & Berikan Suara</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/80 rounded-full font-label text-label uppercase tracking-widest backdrop-blur-sm text-white border border-white/20">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Status: Sudah Memilih
                </div>
                <div className="max-w-md">
                    <h2 className="font-display text-display mb-4">Terima Kasih!</h2>
                    <p className="font-body opacity-90 text-[16px] mb-8">Suara Anda telah direkam dengan aman menggunakan teknologi enkripsi Hybrid Kriptografi. Kerahasiaan suara Anda dijamin sepenuhnya.</p>
                    
                    {isResultsPublished ? (
                       <button 
                         onClick={() => router.push('/dashboard/hasil')}
                         className="bg-white text-primary font-body-bold px-8 py-4 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3"
                       >
                           <span>Lihat Hasil Pemilihan</span>
                           <span className="material-symbols-outlined">analytics</span>
                       </button>
                    ) : (
                      <button 
                        onClick={() => router.push('/dashboard/success')}
                        className="bg-white text-primary font-body-bold px-8 py-4 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3"
                      >
                          <span>Lihat Bukti Digital</span>
                          <span className="material-symbols-outlined">receipt_long</span>
                      </button>
                    )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 4. Election Info Card */}
        <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[28px]">account_balance</span>
                    </div>
                    <div>
                        <h3 className="font-h3 text-h3">Detail Pemilihan</h3>
                        <p className="font-caption text-caption text-on-surface-variant">ID: ELECTION-{election.id}</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div className="flex justify-between py-3 border-b border-outline-variant/30">
                        <span className="font-body text-on-surface-variant">Judul</span>
                        <span className="font-body-bold text-right ml-4">{election.title}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-outline-variant/30">
                        <span className="font-body text-on-surface-variant">Penyelenggara</span>
                        <span className="font-body-bold text-right ml-4">Panitia Pemilihan</span>
                    </div>
                    <div className="space-y-2 py-3">
                        <span className="font-body text-on-surface-variant block">Deskripsi</span>
                        <p className="font-caption text-caption leading-relaxed text-on-surface-variant/80 italic">
                            &ldquo;{election.description}&rdquo;
                        </p>
                    </div>
                </div>
            </div>
            
            <button className="mt-8 w-full py-3 text-primary font-body-bold border-2 border-primary/20 rounded-xl hover:bg-primary-container/5 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[20px]">description</span>
                Lihat Regulasi Pemilihan
            </button>
        </div>
      </div>
    </div>
  );
}
