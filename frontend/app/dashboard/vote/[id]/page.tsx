'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import { Candidate, Election } from '../../../../types/election';
import { encryptVotePayload, signWithRSA } from '../../../../lib/crypto';
import { Loader2, ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function VoteConfirmationPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [election, setElection] = useState<Election | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    if (user.hasVoted) {
      router.replace('/dashboard/success');
      return;
    }
    if (!user.hasPublicKey) {
      router.replace('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [candidateRes, electionRes] = await Promise.all([
          api.get(`/candidates/${params.id}`),
          api.get('/election/active')
        ]);

        if (candidateRes.data.success && electionRes.data.success) {
          setCandidate(candidateRes.data.data);
          setElection(electionRes.data.data);
        } else {
          setError('Gagal memuat data kandidat atau pemilihan.');
        }
      } catch (err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || 'Terjadi kesalahan jaringan.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, user, authLoading, router]);

  const handleConfirmVote = async () => {
    if (!candidate || !election) return;
    
    setError(null);
    setSubmitting(true);
    
    try {
      // 1. Prepare Payload
      const payload = {
        candidateId: candidate.id,
        timestamp: Date.now()
      };

      // 2. Fetch Server Public Key
      const cryptoConfig = await api.get('/config/crypto');
      if (!cryptoConfig.data.success) {
        throw new Error('Gagal mendapatkan kunci publik server.');
      }
      const serverPublicKeyPem = cryptoConfig.data.data.serverPublicKey;

      // 3. Encrypt Payload with AES-GCM (random key generated internally)
      const { ciphertext, iv, encryptedAesKey } = await encryptVotePayload(payload, serverPublicKeyPem);

      // 4. Get Private Key & Sign Ciphertext
      const privateKeyPem = sessionStorage.getItem('rsa_private_key');
      if (!privateKeyPem) {
        throw new Error('Kunci privat tidak ditemukan. Silakan login ulang.');
      }
      const rsaSignature = await signWithRSA(ciphertext, privateKeyPem);

      // 5. Submit to Backend
      const response = await api.post('/votes', {
        ciphertext,
        iv,
        encryptedAesKey,
        rsaSignature,
        electionId: election.id
      });

      if (response.data.success) {
        await refreshUser(); // Update user.hasVoted locally
        router.replace('/dashboard/success');
      } else {
        setError(response.data.message || 'Gagal mengirimkan suara.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } }, message?: string };
      setError(axiosError.response?.data?.message || axiosError.message || 'Terjadi kesalahan sistem saat memproses suara.');
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error && !candidate) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-sm max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button onClick={() => router.push('/dashboard')} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium">
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!candidate) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => router.push('/dashboard')}
          disabled={submitting}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium mb-8 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" /> Kembali ke Daftar Kandidat
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-slate-900 px-8 py-6 flex items-center gap-4 text-white">
            <ShieldCheck className="w-8 h-8 text-green-400" />
            <div>
              <h1 className="text-xl font-bold">Konfirmasi Enkripsi Suara</h1>
              <p className="text-slate-400 text-sm">Langkah terakhir sebelum suara Anda diamankan.</p>
            </div>
          </div>

          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-8">
              <div className="w-40 h-40 rounded-2xl bg-slate-100 flex-shrink-0 border border-slate-200 overflow-hidden relative">
                 {candidate.photo_url ? (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img src={candidate.photo_url} alt={candidate.name} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-5xl font-black text-slate-300">
                     {candidate.order_number}
                   </div>
                 )}
                 <div className="absolute top-2 left-2 bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm shadow-sm">
                   {candidate.order_number}
                 </div>
              </div>
              
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">{candidate.name}</h2>
                <p className="text-blue-600 font-semibold mb-4">{candidate.current_role}</p>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 italic text-slate-600">
                  &ldquo;{candidate.tagline}&rdquo;
                </div>
              </div>
            </div>

            {error && (
               <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                 <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                 <p className="text-sm text-red-700">{error}</p>
               </div>
            )}

            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mb-8">
              <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Proses Kriptografi
              </h3>
              <ul className="space-y-3 text-sm text-blue-800/80 font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                  Payload suara Anda akan dienkripsi dengan AES-256-GCM.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                  Tanda tangan digital (RSA-PSS) akan disematkan menggunakan kunci privat Anda.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                  Identitas kandidat dilindungi selama transmisi jaringan.
                </li>
              </ul>
            </div>

            <button
              onClick={handleConfirmVote}
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Mengenkripsi & Mengirim Suara...
                </>
              ) : (
                <>
                  Konfirmasi & Enkripsi Suara
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
