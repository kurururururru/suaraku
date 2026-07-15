'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import { Candidate } from '../../../types/election';

export default function CandidateListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isElectionActive, setIsElectionActive] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Ambil status election 
        try {
          const electionRes = await api.get('/election/active');
          if (electionRes.data && electionRes.data.data) {
            setIsElectionActive(electionRes.data.data.status === 'ACTIVE');
          } else {
            setIsElectionActive(false); 
          }
        } catch (e) {
          console.warn("Gagal mengambil status election");
          setIsElectionActive(false); 
        }

        // Ambil kandidat dari API
        const candidatesRes = await api.get('/candidates');
        if (candidatesRes.data.success && candidatesRes.data.data) {
           setCandidates(candidatesRes.data.data);
        }
      } catch (error) {
        console.error("Gagal memuat kandidat", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handler tombol vote
  const handleVoteClick = (candidateId: string) => {
    router.push('/dashboard/konfirmasi?candidateId=' + candidateId);
  };

  return (
    <div className="p-container-padding max-w-[1280px] mx-auto w-full space-y-section-gap pb-20">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-h1 text-h1 text-on-surface">Daftar Kandidat</h1>
            <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed font-label text-label rounded-full whitespace-nowrap">
              {loading ? '...' : candidates.length} Kandidat Terdaftar
            </span>
          </div>
          <p className="text-on-surface-variant font-body max-w-2xl">
            Kenali lebih dalam visi dan misi para calon pemimpin yang akan membawa perubahan positif bagi seluruh civitas akademika.
          </p>
        </div>
      </div>

      {!loading && !isElectionActive && !user?.hasVoted && (
        <div className="bg-[#FFFBEB] border border-[#F59E0B] p-4 rounded-xl flex gap-3 items-center text-[#92400E]">
          <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <p className="font-body text-sm leading-relaxed">
            <strong>Informasi:</strong> Pemilihan belum dimulai atau sedang ditutup oleh Admin. Anda baru bisa menekan tombol <strong>Pilih Sekarang</strong> setelah Admin membuka pemilihan.
          </p>
        </div>
      )}

      {/* Grid Content */}
      {loading ? (
        // Skeleton Loading State
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack-md">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-lg border border-outline-variant/20 shadow-sm flex flex-col relative overflow-hidden animate-pulse">
              <div className="flex gap-6 items-start">
                <div className="w-20 h-20 rounded-full bg-surface-container-high shrink-0"></div>
                <div className="flex-1 pt-1 space-y-3">
                  <div className="h-6 bg-surface-container-high rounded w-3/4"></div>
                  <div className="h-4 bg-surface-container-high rounded w-1/3"></div>
                  <div className="h-10 bg-surface-container-high rounded w-full"></div>
                </div>
              </div>
              <div className="mt-auto pt-6 flex items-center justify-between border-t border-outline-variant/10">
                 <div className="h-5 bg-surface-container-high rounded w-1/4"></div>
                 <div className="h-10 bg-surface-container-high rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        // Empty State
        <div className="bg-surface-container-lowest border border-outline-variant p-12 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm">
          <span className="material-symbols-outlined text-[64px] text-outline mb-6">person_off</span>
          <h2 className="font-h2 text-h2 text-on-surface mb-2">Belum ada kandidat</h2>
          <p className="text-on-surface-variant max-w-md">Kandidat yang Anda cari tidak ditemukan atau belum didaftarkan pada pemilihan ini.</p>
        </div>
      ) : (
        // Candidate Grid
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack-md">
          {candidates.map(candidate => {
            const hasVoted = user?.hasVoted;
            const isVoteDisabled = hasVoted || !isElectionActive;

            return (
              <div 
                key={candidate.id} 
                className={`bg-white p-6 rounded-lg border border-outline-variant/20 shadow-sm flex flex-col relative overflow-hidden group ${
                  hasVoted ? 'grayscale opacity-80 bg-surface-container-low border-outline-variant/30' : 'hover:-translate-y-1 transition-all duration-200'
                }`}
              >
                {/* Overlay Locked if Voted */}
                {hasVoted && (
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] z-20 flex items-center justify-center pointer-events-none">
                    <div className="bg-inverse-surface text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                      <span className="font-label text-label">Sudah Memilih</span>
                    </div>
                  </div>
                )}

                {/* Badge Nomor Urut */}
                <div className="absolute top-4 left-4 z-10">
                  <span className={`px-3 py-1 font-label text-label rounded-full shadow-sm ${hasVoted ? 'bg-outline text-white' : 'bg-primary-container text-white'}`}>
                    Nomor Urut 0{candidate.order_number}
                  </span>
                </div>

                {/* Card Content */}
                <div className="flex gap-6 items-start">
                  <div className={`w-20 h-20 rounded-full overflow-hidden border-2 p-0.5 shrink-0 ${hasVoted ? 'border-outline' : 'border-primary-container'}`}>
                    <img 
                      src={candidate.photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(candidate.name) + '&background=random'} 
                      alt={`Foto ${candidate.name}`} 
                      className="w-full h-full object-cover object-top rounded-full"
                    />
                  </div>
                  <div className="flex-1 pt-1">
                    <h2 className="font-h3 text-h3 text-on-surface font-semibold mb-1">{candidate.name}</h2>
                    <p className={`font-body-bold text-caption uppercase tracking-wider mb-3 ${hasVoted ? 'text-outline' : 'text-primary'}`}>
                      {candidate.current_role}
                    </p>
                    <p className="italic text-on-surface-variant font-body mb-4">
                      "{candidate.tagline}"
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-auto pt-6 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-outline-variant/10">
                  {hasVoted ? (
                    <span className="text-outline font-body-bold">Profil Dikunci</span>
                  ) : (
                    <Link 
                      href={`/dashboard/kandidat/${candidate.id}`}
                      className="flex items-center gap-1 text-primary font-body-bold hover:underline"
                    >
                      Lihat Profil
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </Link>
                  )}
                  
                  <button 
                    disabled={isVoteDisabled}
                    onClick={() => handleVoteClick(candidate.id.toString())}
                    className={`px-6 py-2 rounded-lg font-body-bold transition-all w-full sm:w-auto ${
                      isVoteDisabled
                        ? 'bg-outline-variant text-on-surface-variant/40 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-primary-container active:scale-95 shadow-sm'
                    }`}
                  >
                    Pilih Sekarang
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
