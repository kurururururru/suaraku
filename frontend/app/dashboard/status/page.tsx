'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import { Election } from '../../../types/election';

export default function StatusPemilihanPage() {
  const { user } = useAuth();
  const [election, setElection] = useState<Election | null>(null);
  const [candidatesCount, setCandidatesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number } | null>(null);
  
  const hasVoted = user?.hasVoted;
  const [receipt, setReceipt] = useState<{ verificationCode: string; votedAt: string } | null>(null);



  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [electionRes, candidatesRes] = await Promise.all([
          api.get('/election/active').catch(() => ({ data: { data: null } })),
          api.get('/candidates').catch(() => ({ data: { data: [] } }))
        ]);

        if (electionRes.data?.data) {
          setElection(electionRes.data.data);
        }
        
        if (candidatesRes.data?.data) {
          setCandidatesCount(candidatesRes.data.data.length);
        }
        
        if (user?.hasVoted) {
          try {
            const receiptRes = await api.get('/votes/my-receipt');
            if (receiptRes.data?.data) {
              setReceipt(receiptRes.data.data);
            }
          } catch (e) {
            console.error("Failed to fetch receipt", e);
          }
        }
      } catch (error) {
        console.error("Error fetching status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!election || election.status !== 'ACTIVE') return;

    const timer = setInterval(() => {
      const end = new Date(election.endDate).getTime();
      const now = new Date().getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft(null);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [election]);

  const handleCopy = () => {
    if (!receipt) return;
    navigator.clipboard.writeText(receipt.verificationCode);
    alert('Evidence ID disalin: ' + receipt.verificationCode);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-[40px] text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto p-container-padding animate-fadeIn">
      {/* Header */}
      <div className="mb-section-gap">
        <h1 className="font-h1 text-h1-mobile md:text-h1 text-on-surface mb-1">Status Pemilihan</h1>
        <p className="font-body text-on-surface-variant">Pantau perkembangan pemilihan dan status partisipasi Anda.</p>
      </div>

      {!election ? (
         <div className="bg-surface-container-lowest border border-outline-variant p-12 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm">
           <span className="material-symbols-outlined text-[64px] text-outline mb-6">calendar_month</span>
           <h2 className="font-h2 text-h2 text-on-surface mb-2">Belum Ada Pemilihan</h2>
           <p className="text-on-surface-variant max-w-md">Saat ini tidak ada pemilihan yang dapat dipantau.</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Main Election Info Card */}
          <section className="lg:col-span-8 space-y-gutter">
            <div className="bg-surface-container-lowest p-6 shadow-sm border border-outline-variant flex flex-col md:flex-row gap-6 items-start relative overflow-hidden rounded-xl">
              <div className="absolute top-0 right-0 p-6">
                <span className={`px-3 py-1 rounded-full text-label font-label flex items-center gap-1 ${
                  election.status === 'ACTIVE' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-surface-variant text-on-surface-variant'
                }`}>
                  {election.status === 'ACTIVE' && <span className="w-2 h-2 bg-[#F59E0B] rounded-full animate-pulse"></span>}
                  {election.status === 'ACTIVE' ? 'Sedang Berlangsung' : election.status}
                </span>
              </div>
              <div className="w-24 h-24 bg-surface-container-high rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[40px] text-primary">how_to_vote</span>
              </div>
              <div className="flex-1">
                <h2 className="font-h2 text-h2 text-primary mb-2">{election.title}</h2>
                <div className="flex flex-wrap gap-4 text-on-surface-variant font-caption">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">account_balance</span>
                    KPU Universitas
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    {new Date(election.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(election.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="mt-6">
                  <p className="font-label text-on-surface-variant mb-2">Progress Pemilihan</p>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-1000" style={{ width: '65.2%' }}></div>
                  </div>
                  <p className="mt-2 font-caption text-primary text-right">Progress dapat dilihat di Hasil Pemilihan setelah pemilihan ditutup.</p>
                </div>
              </div>
            </div>

            {/* Participation Status Card */}
            {hasVoted ? (
              <div className="bg-surface-container-lowest p-6 shadow-sm border border-outline-variant flex items-center gap-6 rounded-xl">
                <div className="w-16 h-16 bg-[#D1FAE5] text-[#065F46] rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div>
                      <h3 className="font-h3 text-h3 text-on-surface">Status Memilih: Sudah Memilih</h3>
                      <p className="font-body text-on-surface-variant mt-1">Selesai pada: {receipt ? new Date(receipt.votedAt).toLocaleString('id-ID') : 'Memuat...'}</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-surface-container-low border border-outline-variant border-dashed flex items-center justify-between rounded-lg">
                    <span className="font-label text-on-surface-variant">Evidence ID: {receipt ? receipt.verificationCode : 'Memuat...'}</span>
                    <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary" onClick={handleCopy}>content_copy</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-lowest p-6 shadow-sm border border-outline-variant flex items-center gap-6 rounded-xl">
                <div className="w-16 h-16 bg-error-container text-error rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-h3 text-h3 text-on-surface">Status Memilih: Belum Memilih</h3>
                  <p className="font-body text-on-surface-variant mt-1">Anda belum menggunakan hak pilih. Silakan memberikan suara sebelum masa voting berakhir.</p>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              <div className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm text-center rounded-xl">
                <p className="font-label text-on-surface-variant mb-1">Total Kandidat</p>
                <p className="font-display text-display text-primary">{candidatesCount}</p>
              </div>
              <div className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm text-center rounded-xl">
                <p className="font-label text-on-surface-variant mb-1">Total Pemilih</p>
                <p className="font-display text-display text-primary">12,450</p>
              </div>
              <div className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm text-center rounded-xl">
                <p className="font-label text-on-surface-variant mb-1">Tingkat Partisipasi</p>
                <p className="font-display text-display text-[#059669]">65.2%</p>
              </div>
            </div>
          </section>

          {/* Sidebar Stats Section */}
          <aside className="lg:col-span-4 space-y-gutter">
            {/* Countdown Card */}
            <div className="bg-primary-container text-on-primary-container p-6 shadow-md border-none relative overflow-hidden rounded-xl">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern height="40" id="grid" patternUnits="userSpaceOnUse" width="40">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"></path>
                    </pattern>
                  </defs>
                  <rect fill="url(#grid)" height="100%" width="100%"></rect>
                </svg>
              </div>
              
              {election.status === 'ACTIVE' && timeLeft ? (
                <>
                  <h3 className="font-h3 text-h3 mb-4 relative">Sisa Waktu Pemilihan</h3>
                  <div className="flex justify-between items-center relative">
                    <div className="text-center">
                      <span className="block font-display text-h1">{timeLeft.days.toString().padStart(2, '0')}</span>
                      <span className="text-caption font-label uppercase">Hari</span>
                    </div>
                    <span className="font-display text-h1 pb-4">:</span>
                    <div className="text-center">
                      <span className="block font-display text-h1">{timeLeft.hours.toString().padStart(2, '0')}</span>
                      <span className="text-caption font-label uppercase">Jam</span>
                    </div>
                    <span className="font-display text-h1 pb-4">:</span>
                    <div className="text-center">
                      <span className="block font-display text-h1">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                      <span className="text-caption font-label uppercase">Menit</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center relative py-4">
                  <span className="material-symbols-outlined text-[48px] mb-2 opacity-80">timer_off</span>
                  <h3 className="font-h3 text-h3">Periode voting telah berakhir</h3>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-surface-container-lowest p-6 border border-outline-variant shadow-sm rounded-xl">
              <h3 className="font-h3 text-h3 mb-6">Timeline Pemilihan</h3>
              <div className="space-y-6">
                
                {/* Step 1 */}
                <div className="flex gap-4 relative">
                  <div className="z-10 w-6 h-6 bg-primary text-on-primary rounded-full flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
                  </div>
                  <div className="absolute left-3 top-6 bottom-[-1.5rem] w-[2px] bg-primary"></div>
                  <div>
                    <p className="font-body-bold text-on-surface">Pemilihan Dibuat</p>
                    <p className="font-caption text-on-surface-variant">Oleh Administrator</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 relative">
                  <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${election.status === 'ACTIVE' || election.status === 'CLOSED' || election.status === 'RESULTS_PUBLISHED' ? 'bg-primary text-on-primary' : 'bg-surface-container-high border-2 border-outline-variant'}`}>
                    {election.status === 'ACTIVE' || election.status === 'CLOSED' || election.status === 'RESULTS_PUBLISHED' ? <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'wght' 700" }}>check</span> : null}
                  </div>
                  <div className={`absolute left-3 top-6 bottom-[-1.5rem] w-[2px] ${election.status === 'ACTIVE' || election.status === 'CLOSED' || election.status === 'RESULTS_PUBLISHED' ? 'bg-primary' : 'bg-outline-variant'}`}></div>
                  <div>
                    <p className="font-body-bold text-on-surface">Voting Dibuka</p>
                    <p className="font-caption text-on-surface-variant">{new Date(election.startDate).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 relative">
                  <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${hasVoted ? 'bg-primary text-on-primary' : 'bg-surface-container-high border-2 border-outline-variant'}`}>
                     {hasVoted ? <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'wght' 700" }}>check</span> : null}
                  </div>
                  <div className={`absolute left-3 top-6 bottom-[-1.5rem] w-[2px] ${hasVoted ? 'bg-primary' : 'bg-outline-variant'}`}></div>
                  <div>
                    <p className={`font-body-bold ${hasVoted ? 'text-on-surface' : 'text-on-surface-variant'}`}>{hasVoted ? 'Anda Sudah Memilih' : 'Menunggu Pilihan Anda'}</p>
                    <p className="font-caption text-on-surface-variant">{hasVoted ? (receipt ? new Date(receipt.votedAt).toLocaleString('id-ID') : 'Memuat...') : 'Silakan gunakan hak pilih'}</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4 relative">
                  <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${election.status === 'CLOSED' || election.status === 'RESULTS_PUBLISHED' ? 'bg-primary text-on-primary' : 'bg-surface-container-high border-2 border-outline-variant'}`}>
                     {election.status === 'CLOSED' || election.status === 'RESULTS_PUBLISHED' ? <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'wght' 700" }}>check</span> : null}
                  </div>
                  <div className={`absolute left-3 top-6 bottom-[-1.5rem] w-[2px] ${election.status === 'CLOSED' || election.status === 'RESULTS_PUBLISHED' ? 'bg-primary' : 'bg-outline-variant'}`}></div>
                  <div>
                    <p className={`font-body-bold ${election.status === 'CLOSED' || election.status === 'RESULTS_PUBLISHED' ? 'text-on-surface' : 'text-on-surface-variant'}`}>Voting Ditutup</p>
                    <p className="font-caption text-on-surface-variant">{new Date(election.endDate).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex gap-4">
                  <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${election.status === 'RESULTS_PUBLISHED' ? 'bg-primary text-on-primary' : 'bg-surface-container-high border-2 border-outline-variant'}`}>
                     {election.status === 'RESULTS_PUBLISHED' ? <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'wght' 700" }}>check</span> : null}
                  </div>
                  <div>
                    <p className={`font-body-bold ${election.status === 'RESULTS_PUBLISHED' ? 'text-on-surface' : 'text-on-surface-variant'}`}>Hasil Dipublikasikan</p>
                    <p className="font-caption text-on-surface-variant">Menunggu penetapan</p>
                  </div>
                </div>

              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
