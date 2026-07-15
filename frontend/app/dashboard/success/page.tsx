'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { VoteReceipt } from '../../../types/election';
import { Loader2, CheckCircle2, Copy, LogOut, ShieldCheck } from 'lucide-react';

export default function VoteSuccessPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  
  const [receipt, setReceipt] = useState<VoteReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    
    // If the user hasn't voted, they shouldn't be here
    if (!user.hasVoted) {
      router.replace('/dashboard');
      return;
    }

    const fetchReceipt = async () => {
      try {
        const response = await api.get('/votes/my-receipt');
        if (response.data.success && response.data.data) {
          setReceipt(response.data.data);
        } else {
          setError('Gagal memuat bukti voting.');
        }
      } catch (err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || 'Terjadi kesalahan jaringan.');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [user, authLoading, router]);

  const handleCopy = () => {
    if (receipt?.verificationCode) {
      navigator.clipboard.writeText(receipt.verificationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600 rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600 rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>

      <div className="max-w-xl w-full bg-slate-800/60 backdrop-blur-2xl border border-slate-700 rounded-3xl p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-500 text-center">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-2">Suara Berhasil Direkam!</h1>
        <p className="text-slate-400 mb-8">Terima kasih atas partisipasi Anda dalam pemilihan ini. Suara Anda telah diamankan menggunakan enkripsi End-to-End.</p>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8">
            {error}
          </div>
        ) : receipt ? (
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 mb-8 text-left relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Kode Verifikasi Suara</h3>
                <p className="text-2xl font-mono text-emerald-400 font-bold tracking-widest">{receipt.verificationCode}</p>
              </div>
              <button 
                onClick={handleCopy}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white group relative"
                title="Salin Kode"
              >
                {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                {copied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-slate-700 px-2 py-1 rounded text-white whitespace-nowrap">Tersalin!</span>}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800">
              <div>
                <p className="text-xs text-slate-500 mb-1">Waktu Voting</p>
                <p className="text-sm text-slate-300 font-medium">
                  {new Date(receipt.votedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Status Keamanan</p>
                <p className="text-sm text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> {receipt.status}
                </p>
              </div>
            </div>

            {receipt.candidateName && (
              <div className="mt-6 pt-6 border-t border-slate-800">
                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-bold">Pilihan Anda</p>
                <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl shrink-0">
                    {receipt.candidateOrder}
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">{receipt.candidateName}</p>
                    <p className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3" /> Pilihan Terekam
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-8 text-left flex gap-3">
          <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
          <p className="text-sm text-blue-300/80">Simpan kode verifikasi Anda. Anda dapat menggunakannya nanti untuk memastikan bahwa suara Anda tidak diubah selama proses perhitungan akhir.</p>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
}
