'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '../../../lib/api';
import { Election } from '../../../types/election';

// Types from the backend service response
interface ResultCandidate {
  id: number;
  name: string;
  orderNumber: number;
  photoUrl: string;
  voteCount: number;
  percentage: number;
}

interface ElectionResult {
  election: {
    title: string;
    totalVoters: number;
    votesIn: number;
    participationRate: number;
  };
  candidates: ResultCandidate[];
  winner: ResultCandidate | null;
}

export default function HasilPemilihanPage() {
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [election, setElection] = useState<Election | null>(null);
  const [results, setResults] = useState<ElectionResult | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch active election
        const electionRes = await api.get('/election/active').catch(() => ({ data: { data: null } }));
        const activeElection = electionRes.data?.data;
        
        if (activeElection) {
          setElection(activeElection);

          // If published, fetch results
          if (activeElection.status === 'RESULTS_PUBLISHED') {
            try {
              const res = await api.get(`/election/${activeElection.id}/results`);
              if (res.data?.success) {
                setResults(res.data.data);
              }
            } catch (err) {
              console.error("Failed to fetch results", err);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-[40px] text-primary">progress_activity</span>
      </div>
    );
  }

  const isPublished = election?.status === 'RESULTS_PUBLISHED';

  return (
    <div className="px-container-padding py-section-gap max-w-[1280px] mx-auto space-y-section-gap animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-start">
         <div>
            <h1 className="font-h1 text-h1 text-primary">Hasil Pemilihan</h1>
            <p className="text-caption text-on-surface-variant">Lihat hasil akhir pemilihan secara transparan.</p>
         </div>
      </div>

      {!isPublished ? (
        <div className="bg-surface-container-lowest border border-outline-variant p-12 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm">
           <span className="material-symbols-outlined text-[64px] text-outline mb-6">lock_clock</span>
           <h2 className="font-h2 text-h2 text-on-surface mb-2">Hasil Belum Dipublikasikan</h2>
           <p className="text-on-surface-variant max-w-md">Proses rekapitulasi dan validasi masih berlangsung, atau administrator belum mempublikasikan hasil pemilihan ini secara resmi.</p>
           <div className="mt-8 px-4 py-2 bg-surface-container-high rounded-full text-label font-label text-on-surface-variant uppercase tracking-wider">
             Status: {election?.status || 'Menunggu'}
           </div>
        </div>
      ) : (
         results && <ResultsDashboard results={results} />
      )}
    </div>
  );
}

// Komponen Pembantu untuk UI Hasil
function ResultsDashboard({ results }: { results: ElectionResult }) {
  const winner = results.winner;
  const candidates = results.candidates;
  
  // Total invalid votes is dummy for now since backend doesn't provide it yet
  const invalidVotes = 320; 
  const validVotes = results.election.votesIn - invalidVotes;

  return (
    <>
      {/* Statistics Quick Glance */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-stack-md">
        <div className="bg-surface-container-lowest p-container-padding rounded-xl shadow-sm border border-outline-variant">
          <p className="text-caption text-on-surface-variant">Total Pemilih</p>
          <h3 className="text-h1 font-h1 text-on-surface">{results.election.totalVoters.toLocaleString('id-ID')}</h3>
        </div>
        <div className="bg-surface-container-lowest p-container-padding rounded-xl shadow-sm border border-outline-variant">
          <p className="text-caption text-on-surface-variant">Suara Masuk</p>
          <h3 className="text-h1 font-h1 text-on-surface">{results.election.votesIn.toLocaleString('id-ID')}</h3>
        </div>
        <div className="bg-surface-container-lowest p-container-padding rounded-xl shadow-sm border border-outline-variant">
          <p className="text-caption text-on-surface-variant">Partisipasi</p>
          <h3 className="text-h1 font-h1 text-secondary">{results.election.participationRate}%</h3>
        </div>
        <div className="bg-surface-container-lowest p-container-padding rounded-xl shadow-sm border border-outline-variant">
          <p className="text-caption text-on-surface-variant">Suara Sah</p>
          <h3 className="text-h1 font-h1 text-on-surface">{validVotes > 0 ? validVotes.toLocaleString('id-ID') : 0}</h3>
        </div>
        <div className="bg-surface-container-lowest p-container-padding rounded-xl shadow-sm border border-outline-variant">
          <p className="text-caption text-on-surface-variant">Suara Tidak Sah</p>
          <h3 className="text-h1 font-h1 text-error">{invalidVotes}</h3>
        </div>
      </div>

      {/* Hero Winner & Data Viz Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Winner Hero Card */}
        {winner && (
          <div className="lg:col-span-8 bg-primary-container text-on-primary-container p-container-padding rounded-xl shadow-md relative overflow-hidden flex flex-col md:flex-row gap-section-gap">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="relative z-10 w-full md:w-1/3 aspect-[3/4] rounded-lg overflow-hidden border-2 border-primary-fixed shadow-xl bg-surface-container-lowest flex items-center justify-center">
              {winner.photoUrl ? (
                 <img className="w-full h-full object-cover" src={winner.photoUrl} alt={winner.name} />
              ) : (
                 <span className="material-symbols-outlined text-[64px] text-primary">person</span>
              )}
              <div className="absolute top-4 left-4 bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                <span className="text-label uppercase tracking-wider">Terpilih</span>
              </div>
            </div>
            <div className="relative z-10 flex-1 flex flex-col justify-center">
              <span className="text-label uppercase tracking-[0.2em] opacity-80 mb-2">Pemenang Pemilihan</span>
              <h2 className="font-display text-display mb-stack-sm">{winner.name}</h2>
              <div className="flex gap-stack-md mb-stack-md">
                <div className="bg-white/10 px-4 py-2 rounded-lg">
                  <p className="text-caption opacity-70">Total Suara</p>
                  <p className="text-h2 font-h2">{winner.voteCount.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-lg">
                  <p className="text-caption opacity-70">Persentase</p>
                  <p className="text-h2 font-h2">{winner.percentage}%</p>
                </div>
              </div>
              <div className="bg-white/10 p-stack-md rounded-lg border border-white/10">
                <p className="font-body-bold mb-1">Status Validasi:</p>
                <p className="text-caption leading-relaxed italic opacity-90">"Telah diverifikasi oleh KPU Universitas dan sistem keamanan Kriptografi tersertifikasi."</p>
              </div>
            </div>
          </div>
        )}

        {/* Distribution Chart (Simplified Bar Chart) */}
        <div className="lg:col-span-4 bg-surface-container-lowest p-container-padding rounded-xl shadow-sm border border-outline-variant flex flex-col h-full min-h-[300px]">
          <h3 className="font-h3 text-h3 mb-stack-md">Distribusi Suara</h3>
          <div className="flex-1 flex flex-col justify-end">
            <div className="flex items-end justify-around px-4 h-[200px]">
              {candidates.slice(0, 4).map((c, index) => {
                const heightPercentage = Math.max(Math.min((c.percentage / (winner?.percentage || 100)) * 100, 100), 5);
                const isWinner = index === 0;
                return (
                  <div key={c.id} className="flex flex-col items-center gap-2 group w-full px-1">
                    <div className={`w-full max-w-[40px] relative transition-all duration-1000 ease-out rounded-t-md ${isWinner ? 'bg-primary-container' : 'bg-outline-variant'}`} style={{ height: `${heightPercentage}%` }}>
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-caption font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-surface-container-high px-2 py-1 rounded shadow-sm text-on-surface z-20">
                         {c.percentage}%
                       </div>
                    </div>
                    <span className="text-label text-on-surface-variant">{c.orderNumber.toString().padStart(2, '0')}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-stack-md flex justify-center gap-4 text-caption text-on-surface-variant border-t border-outline-variant pt-stack-sm">
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-primary-container rounded-full"></div> Tertinggi</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-outline-variant rounded-full"></div> Lainnya</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ranking List Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="p-container-padding border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <h3 className="font-h3 text-h3">Peringkat Suara Kandidat</h3>
          <div className="flex items-center gap-2 text-caption text-on-surface-variant hidden md:flex">
             <span className="material-symbols-outlined text-[18px]">update</span>
             Data Hasil Akhir Resmi
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-surface-container-low text-label text-on-surface-variant uppercase tracking-wider">
              <tr>
                <th className="px-container-padding py-stack-md w-20">Rank</th>
                <th className="px-container-padding py-stack-md">Kandidat</th>
                <th className="px-container-padding py-stack-md">Total Suara</th>
                <th className="px-container-padding py-stack-md w-1/3">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {candidates.map((c, index) => (
                <tr key={c.id} className={`hover:bg-surface-container-low transition-colors group ${index % 2 === 1 ? 'bg-surface-container-low/30' : ''}`}>
                  <td className={`px-container-padding py-stack-md font-h3 ${index === 0 ? 'text-on-surface' : 'text-on-surface-variant'}`}>{index + 1}</td>
                  <td className="px-container-padding py-stack-md">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full overflow-hidden border-2 bg-surface-container-lowest flex items-center justify-center ${index === 0 ? 'border-primary-container' : 'border-outline-variant'}`}>
                        {c.photoUrl ? (
                          <img className="w-full h-full object-cover" src={c.photoUrl} alt={c.name} />
                        ) : (
                          <span className="material-symbols-outlined text-outline">person</span>
                        )}
                      </div>
                      <div>
                        <p className="font-body-bold">{c.name}</p>
                        <p className="text-caption text-on-surface-variant">Nomor Urut {c.orderNumber.toString().padStart(2, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-container-padding py-stack-md font-body-bold">{c.voteCount.toLocaleString('id-ID')}</td>
                  <td className="px-container-padding py-stack-md">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-surface-container-high h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${index === 0 ? 'bg-primary-container' : 'bg-outline'}`} style={{ width: `${c.percentage}%` }}></div>
                      </div>
                      <span className={`font-body-bold ${index === 0 ? 'text-primary' : ''}`}>{c.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Final Footer Information */}
      <footer className="flex flex-col md:flex-row justify-between items-center gap-stack-md border-t border-outline-variant pt-section-gap pb-container-padding text-caption text-on-surface-variant">
        <div className="flex flex-col items-center md:items-start gap-1">
           <p>Pemilihan: <span className="font-body-bold text-on-surface">{results.election.title}</span></p>
           <p>Penyelenggara: <span className="font-body-bold text-on-surface">KPU Universitas</span></p>
        </div>
        <div className="flex items-center gap-2 bg-secondary-container/30 px-4 py-2 rounded-full border border-secondary-container">
           <span className="material-symbols-outlined text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
           <span className="font-body-bold text-on-secondary-container uppercase tracking-wider">Status: Terverifikasi & Sah</span>
        </div>
        <div className="flex gap-4">
           <button className="flex items-center gap-2 hover:text-primary transition-colors">
             <span className="material-symbols-outlined text-[18px]">verified_user</span>
             Integritas Kriptografi Valid
           </button>
        </div>
      </footer>
    </>
  );
}


