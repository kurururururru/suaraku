'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import { Candidate, Election } from '../../../types/election';
import { signWithRSA, encryptVotePayload } from '../../../lib/crypto';

function KonfirmasiContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateId = searchParams?.get('candidateId');
  const { user, refreshUser } = useAuth();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [electionId, setElectionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    // Validasi dasar
    if (user?.hasVoted) {
      router.push('/dashboard');
      return;
    }

    if (!candidateId) {
      router.push('/dashboard/kandidat');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Cek status election
        try {
          const electionRes = await api.get('/election/active');
          if (electionRes.data && electionRes.data.data) {
             if (electionRes.data.data.status !== 'ACTIVE') {
                 router.push('/dashboard/kandidat');
                 return;
             }
             setElectionId(electionRes.data.data.id);
          } else {
             router.push('/dashboard/kandidat');
             return;
          }
        } catch (e) {
          console.warn("Gagal mengecek election aktif");
        }

        // Ambil data kandidat
        const candidatesRes = await api.get('/candidates');
        if (candidatesRes.data.success && candidatesRes.data.data) {
          const found = candidatesRes.data.data.find((c: Candidate) => c.id.toString() === candidateId);
          if (found) {
            setCandidate(found);
          } else {
            router.push('/dashboard/kandidat');
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [candidateId, user, router]);

  const handleSubmit = async () => {
    if (!agreed || submitting) return;
    
    if (!electionId) {
      alert("Tidak ada pemilihan aktif yang valid.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Dapatkan Server Public Key
      const configRes = await api.get('/config/crypto');
      const serverPublicKey = configRes.data.data.serverPublicKey;

      if (!serverPublicKey) {
         throw new Error("Kunci publik server tidak ditemukan");
      }

      // 2. Siapkan Payload
      const votePayload = {
        candidateId: candidateId,
        electionId: electionId,
        timestamp: new Date().toISOString()
      };

      // 3. Ambil RSA Private Key dari sessionStorage
      const privateKeyPem = typeof window !== 'undefined' ? sessionStorage.getItem('rsa_private_key') : null;
      if (!privateKeyPem) {
        throw new Error("RSA Private Key Anda tidak ditemukan di memori perangkat ini. Silakan logout dan login ulang agar sistem dapat meregistrasi kembali profil Public/Private Key Anda.");
      }

      // 4. Enkripsi Payload secara Hybrid
      const { ciphertext, iv, encryptedAesKey } = await encryptVotePayload(votePayload, serverPublicKey);

      // 5. Buat Digital Signature (Tanda tangan ke Ciphertext)
      const rsaSignature = await signWithRSA(ciphertext, privateKeyPem);

      // 6. Kirim ke API Pengumpulan Suara
      await api.post('/votes', {
        ciphertext,
        iv,
        rsaSignature,
        encryptedAesKey,
        electionId: electionId
      });

      // 7. Refresh Auth User Context agar hasVoted menjadi 'true' dari Backend
      if (refreshUser) {
        await refreshUser();
      }

      // Berhasil, arahkan ke halaman sukses
      router.push('/dashboard/sukses');
    } catch (error: any) {
      console.error("Gagal mengirim suara:", error);
      alert(error?.response?.data?.message || error.message || "Gagal mengirim suara.\nTerjadi kesalahan jaringan.\nSilakan coba beberapa saat lagi.");
      setSubmitting(false); 
    }
  };

  if (loading) {
    return (
      <div className="flex-grow w-full max-w-[1280px] mx-auto px-container-padding py-section-gap flex flex-col items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-[40px] text-primary">progress_activity</span>
        <p className="mt-4 text-on-surface-variant font-body">Memuat data konfirmasi...</p>
      </div>
    );
  }

  if (!candidate) return null; // Sedang di-redirect

  return (
    <div className="flex-grow w-full max-w-[1280px] mx-auto px-container-padding py-section-gap flex flex-col items-center relative mb-24">
      {/* High-Stakes Atmosphere Header */}
      <div className="text-center mb-section-gap">
        <div className="inline-flex items-center gap-2 bg-primary-fixed text-on-primary-fixed px-4 py-1.5 rounded-full mb-4">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
          <span className="font-label text-label uppercase tracking-wider">Tahap Terakhir</span>
        </div>
        <h1 className="font-display text-display text-on-background mb-stack-sm">Konfirmasi Pilihan Anda</h1>
        <p className="text-on-surface-variant max-w-xl mx-auto font-body">
          Tinjau kembali kandidat yang telah Anda pilih. Pastikan pilihan Anda sudah benar sebelum mengirimkan suara secara permanen.
        </p>
      </div>

      {/* Confirmation Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-5xl">
        {/* Left Side: Candidate Detail Card */}
        <div className="lg:col-span-7 flex flex-col gap-gutter">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm transition-all duration-500 hover:shadow-md">
            <div className="flex flex-col md:flex-row h-full">
              <div className="md:w-2/5 relative h-64 md:h-auto border-b md:border-b-0 md:border-r border-outline-variant/30">
                <img 
                  className="w-full h-full object-cover object-top" 
                  src={candidate.photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(candidate.name) + '&background=random&size=400'} 
                  alt={candidate.name} 
                />
                <div className="absolute top-4 left-4 bg-primary text-on-primary font-display text-[42px] w-16 h-16 flex items-center justify-center rounded-lg shadow-lg">
                  0{candidate.order_number}
                </div>
              </div>
              
              <div className="md:w-3/5 p-6 flex flex-col justify-between">
                <div>
                  <span className="font-label text-label text-primary uppercase mb-1 block">{candidate.current_role}</span>
                  <h2 className="font-h1 text-h1 text-on-background mb-2">{candidate.name}</h2>
                  <p className="text-on-surface-variant font-body mb-4 italic">
                    "{candidate.tagline || 'Pemimpin yang transparan dan inklusif untuk kesejahteraan bersama.'}"
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[20px]">school</span>
                      </div>
                      <span className="text-on-surface-variant font-body-bold">Fakultas Ilmu Komputer</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[20px]">groups</span>
                      </div>
                      <span className="text-on-surface-variant font-body-bold">Angkatan 2021</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-between">
                  <span className="text-on-surface-variant font-caption italic">Pilihan Terdaftar</span>
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Warning and Actions */}
        <div className="lg:col-span-5 flex flex-col gap-gutter">
          {/* Warning Box */}
          <div className="bg-[#FFFBEB] border-2 border-[#F59E0B] p-6 rounded-xl flex gap-stack-md items-start">
            <span className="material-symbols-outlined text-[#D97706] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <div>
              <h3 className="font-h3 text-h3 text-[#92400E] mb-1">Perhatian</h3>
              <p className="font-body text-[#B45309] text-[14px] leading-relaxed">
                Suara yang telah dikirim tidak dapat diubah, ditarik kembali, atau diperbaiki. Pastikan Anda telah meninjau pilihan dengan seksama.
              </p>
            </div>
          </div>

          {/* Action Card */}
          <div className="bg-surface border border-outline-variant p-6 rounded-xl shadow-sm flex flex-col gap-stack-md">
            <h3 className="font-h3 text-h3 text-on-surface mb-2">Persetujuan Akhir</h3>
            
            <label className={`flex items-start gap-3 cursor-pointer group p-3 rounded-lg transition-colors ${agreed ? 'bg-surface-container' : 'hover:bg-surface-container-low'}`}>
              <div className="relative flex items-center mt-1 shrink-0">
                <input 
                  type="checkbox"
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-outline transition-all checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2" 
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  disabled={submitting}
                />
                <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="h-3.5 w-3.5" fill="currentColor" stroke="currentColor" strokeWidth="1" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                </span>
              </div>
              <span className="text-on-surface-variant font-body text-[14px] leading-relaxed select-none">
                Saya menyatakan bahwa pilihan ini merupakan pilihan saya sendiri dan saya memahami bahwa suara yang telah dikirim tidak dapat diubah.
              </span>
            </label>

            <div className="flex flex-col gap-3 mt-4">
              <button 
                onClick={handleSubmit}
                disabled={!agreed || submitting}
                className={`w-full font-body-bold py-4 px-6 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all ${
                  (!agreed || submitting) 
                    ? 'opacity-50 cursor-not-allowed bg-outline-variant text-on-surface-variant' 
                    : 'bg-error text-on-error hover:brightness-110 active:scale-[0.98]'
                }`}
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Mengirim Suara...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                    Kirim Suara
                  </>
                )}
              </button>
              
              <Link 
                href={`/dashboard/kandidat/${candidate.id}`}
                className={`w-full bg-transparent border border-outline-variant text-on-surface-variant font-body-bold py-4 px-6 rounded-lg hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 ${submitting ? 'pointer-events-none opacity-50' : ''}`}
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Kembali
              </Link>
            </div>
          </div>

          {/* Footer Context */}
          <div className="flex items-center justify-center gap-2 text-on-surface-variant opacity-60 mt-2">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            <span className="font-caption">Enkripsi End-to-End Aktif</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KonfirmasiPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <span className="material-symbols-outlined animate-spin text-[40px] text-primary">progress_activity</span>
      </div>
    }>
      <KonfirmasiContent />
    </Suspense>
  );
}
