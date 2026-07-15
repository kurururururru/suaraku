'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';
import { Candidate } from '../../../../types/election';

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useAuth();
  
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isElectionActive, setIsElectionActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'visi' | 'pengalaman'>('visi');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Simulasi delay biar skeleton kelihatan
        await new Promise(resolve => setTimeout(resolve, 800));

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

        // Ambil data kandidat
        const candidatesRes = await api.get('/candidates');
        if (candidatesRes.data.success && candidatesRes.data.data) {
          const found = candidatesRes.data.data.find((c: Candidate) => c.id.toString() === id);
          setCandidate(found || null);
        }
      } catch (error) {
        console.error("Gagal memuat kandidat", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleConfirmVote = () => {
    // Arahkan ke halaman konfirmasi
    if (candidate) {
      router.push('/dashboard/konfirmasi?candidateId=' + candidate.id);
    }
  };

  const hasVoted = user?.hasVoted;
  const isVoteDisabled = hasVoted || !isElectionActive;

  if (loading) {
    return (
      <div className="p-container-padding max-w-[1280px] mx-auto w-full pb-24">
        <nav className="mb-6"><div className="w-32 h-6 bg-surface-container-high animate-pulse rounded"></div></nav>
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-section-gap">
          <div className="md:col-span-8 bg-white h-64 animate-pulse rounded-xl shadow-sm"></div>
          <div className="md:col-span-4 bg-primary/20 h-64 animate-pulse rounded-xl shadow-sm"></div>
        </section>
        <section className="bg-white h-96 animate-pulse rounded-xl shadow-sm"></section>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-container-padding max-w-[1280px] mx-auto w-full pb-24 flex flex-col items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-[64px] text-outline mb-4">search_off</span>
        <h2 className="font-h2 text-h2 text-on-surface mb-2">Kandidat Tidak Ditemukan</h2>
        <p className="text-on-surface-variant mb-6">ID kandidat tidak valid atau data telah dihapus.</p>
        <Link href="/dashboard/kandidat" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-container">
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  // Parse missions safely
  const missionsList = candidate.mission ? candidate.mission.split('\n').filter(m => m.trim().length > 0) : [];

  return (
    <div className="p-container-padding max-w-[1280px] mx-auto w-full pb-24">
      {/* Back Button */}
      <nav className="mb-6">
        <Link href="/dashboard/kandidat" className="inline-flex items-center gap-2 text-primary font-body-bold hover:gap-3 transition-all duration-300">
          <span className="material-symbols-outlined">arrow_back</span>
          Kembali ke Daftar
        </Link>
      </nav>

      {!isElectionActive && !user?.hasVoted && (
        <div className="bg-[#FFFBEB] border border-[#F59E0B] p-4 rounded-xl flex gap-3 items-center text-[#92400E] mb-6">
          <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <p className="font-body text-sm leading-relaxed">
            <strong>Informasi:</strong> Pemilihan belum dimulai atau sedang ditutup oleh Admin. Anda baru bisa menekan tombol <strong>Pilih</strong> setelah Admin membuka pemilihan.
          </p>
        </div>
      )}

      {/* Hero Section: Bento Layout */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-section-gap">
        {/* Large Photo & Name */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row border border-outline-variant/30">
          <div className="w-full md:w-2/5 aspect-[4/5] md:aspect-auto border-r border-outline-variant/30">
            <img 
              className="w-full h-full object-cover" 
              src={candidate.photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(candidate.name) + '&background=random&size=400'} 
              alt={candidate.name} 
            />
          </div>
          <div className="w-full md:w-3/5 p-8 flex flex-col justify-center bg-gradient-to-br from-surface-container-lowest to-surface-container-low">
            <div className="mb-4">
              <span className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded-full text-label font-label uppercase tracking-wider">
                {candidate.current_role}
              </span>
            </div>
            <h1 className="font-display text-display text-primary mb-2">{candidate.name}</h1>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-lg">
                <span className="material-symbols-outlined text-primary">school</span>
                <span className="font-body-bold text-on-surface">Angkatan 2021</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-lg">
                <span className="material-symbols-outlined text-primary">verified_user</span>
                <span className="font-body-bold text-on-surface">Terverifikasi</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Nomor Urut Card */}
        <div className="md:col-span-4 bg-primary text-white rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-md relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <span className="material-symbols-outlined text-[200px]">how_to_vote</span>
          </div>
          <p className="font-label text-label uppercase tracking-widest opacity-80 mb-2">Nomor Urut</p>
          <div className="font-display text-[120px] leading-none font-extrabold mb-4">0{candidate.order_number}</div>
          <p className="font-h3 text-h3 font-semibold">{candidate.tagline || 'Pemimpin Masa Depan'}</p>
        </div>
      </section>

      {/* Content Tabs */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-outline-variant/30 px-6 hide-scrollbar">


          {/* Visi Misi Tab */}
          {activeTab === 'visi' && (
            <div className="animate-fadeIn">
              <div className="mb-12">
                <h2 className="font-h2 text-h2 text-primary mb-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary">visibility</span>
                  Visi Utama
                </h2>
                <div className="p-6 bg-surface-container-low rounded-lg border-l-4 border-secondary italic font-h3 text-on-surface">
                  "{candidate.vision || 'Mewujudkan BEM Universitas yang transparan, inklusif, dan berbasis teknologi.'}"
                </div>
              </div>
              
              <div>
                <h2 className="font-h2 text-h2 text-primary mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary">assignment</span>
                  Misi Strategis
                </h2>
                <div className="space-y-6">
                  {missionsList.length > 0 ? missionsList.map((m, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="bg-primary-container text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-body-bold">
                        {idx + 1}
                      </div>
                      <div className="pt-1">
                        <p className="text-on-surface-variant leading-relaxed">{m}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-on-surface-variant italic">Data misi belum tersedia.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pengalaman Tab */}
          {activeTab === 'pengalaman' && (
            <div className="animate-fadeIn">
              <h2 className="font-h2 text-h2 text-primary mb-8">Rekam Jejak Organisasi</h2>
              
              {/* Actual from API if any */}
              {candidate.experience ? (
                <div className="mb-8 p-6 bg-surface-container-lowest border border-outline-variant/30 rounded-lg whitespace-pre-line text-on-surface-variant leading-relaxed">
                  {candidate.experience}
                </div>
              ) : (
                <p className="text-on-surface-variant italic">Data pengalaman belum tersedia.</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Sticky Footer Bar */}
      {(!hasVoted && isElectionActive) ? (
        <div className="fixed bottom-0 left-0 right-0 bg-surface shadow-[0_-4px_10px_rgba(0,0,0,0.05)] border-t border-outline-variant/20 py-4 px-6 z-40">
          <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden sm:block w-12 h-12 rounded-full overflow-hidden border-2 border-primary shrink-0">
                <img className="w-full h-full object-cover object-top" src={candidate.photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(candidate.name)} alt="" />
              </div>
              <div>
                <h4 className="font-body-bold text-on-surface">Pilih {candidate.name}?</h4>
                <p className="text-caption text-on-surface-variant hidden sm:block">Pastikan Anda telah membaca Visi & Misi sebelum memilih.</p>
              </div>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <Link href="/dashboard/kandidat" className="flex-1 sm:flex-none px-6 py-3 border border-outline text-on-surface font-body-bold rounded-lg hover:bg-surface-container transition-colors text-center">
                Nanti Saja
              </Link>
              <button 
                onClick={() => setShowModal(true)}
                className="flex-1 sm:flex-none px-6 py-3 bg-primary text-white font-body-bold rounded-lg hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Pilih Kandidat
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 bg-surface-container-high border-t border-outline-variant/30 py-4 px-6 z-40">
          <div className="max-w-[1280px] mx-auto flex items-center justify-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            <p className="font-body-bold">{hasVoted ? 'Anda sudah menggunakan hak pilih.' : 'Pemilihan sedang tidak aktif.'}</p>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-surface rounded-xl max-w-md w-full shadow-md overflow-hidden animate-zoomIn">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-primary-container text-white rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-[32px]">task_alt</span>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-4">Konfirmasi Pilihan Anda</h3>
              <p className="font-body text-on-surface-variant mb-8">
                Anda akan memilih <strong>{candidate.name} (Nomor Urut 0{candidate.order_number})</strong> sebagai {candidate.current_role}. Tindakan ini tidak dapat dibatalkan setelah dikonfirmasi.
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleConfirmVote}
                  className="w-full py-3 bg-primary text-white font-body-bold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Ya, Saya Yakin
                </button>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-full py-3 border border-outline text-on-surface font-body-bold rounded-lg hover:bg-surface-container transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
