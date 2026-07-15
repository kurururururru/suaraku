'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilSayaPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [hasVotedState, setHasVotedState] = useState(false);

  useEffect(() => {
    // Check if user voted in DB or local fallback
    if (user?.hasVoted) {
       setHasVotedState(true);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-[40px] text-primary">progress_activity</span>
      </div>
    );
  }

  const handleLogout = async () => {
    if (logout) {
      logout();
    } else {
      // Fallback
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      router.push('/login');
    }
  };

  return (
    <div className="px-container-padding py-section-gap max-w-[1200px] mx-auto space-y-8 animate-fadeIn">
      {/* Header Halaman */}
      <div>
         <h1 className="font-h1 text-h1 text-primary">Profil Saya</h1>
         <p className="text-caption text-on-surface-variant">Lihat informasi identitas pemilih, partisipasi, dan keamanan sistem.</p>
      </div>

      {/* Hero Identity Section */}
      <section className="bg-primary-container rounded-xl p-8 overflow-hidden shadow-sm flex flex-col md:flex-row items-center gap-8 relative border border-outline-variant/20">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-fixed-dim rounded-full -ml-20 -mb-20 blur-3xl"></div>
        </div>
        
        <div className="relative z-10 w-24 h-24 rounded-full bg-surface-container-lowest flex items-center justify-center shrink-0 border-4 border-white/20 shadow-md">
           <span className="material-symbols-outlined text-[48px] text-primary">badge</span>
        </div>
        
        <div className="relative z-10 text-center md:text-left flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
            <h2 className="font-display text-display text-white">{user?.name || '-'}</h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-label font-label bg-secondary-container text-on-secondary-container self-center">
              <span className="material-symbols-outlined text-[14px] mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Status: Aktif
            </span>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-white/80">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">tag</span>
              <span className="font-body text-body">{user?.nim || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span className="font-body text-body">{user?.role === 'VOTER' ? 'Pemilih' : (user?.role || '-')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Layout for Info & Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Informasi Akun Card */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant">
            <div className="flex items-center gap-3 mb-6 border-b border-outline-variant pb-4">
              <span className="material-symbols-outlined text-primary">person</span>
              <h3 className="font-h3 text-h3">Informasi Akun</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-caption text-on-surface-variant mb-1">Nama Lengkap</p>
                <p className="font-body-bold text-on-surface">{user?.name || '-'}</p>
              </div>
              <div>
                <p className="text-caption text-on-surface-variant mb-1">NIM / ID Pengguna</p>
                <p className="font-body-bold text-on-surface">{user?.nim || '-'}</p>
              </div>
              <div>
                <p className="text-caption text-on-surface-variant mb-1">Role Akses</p>
                <p className="font-body-bold text-on-surface">{user?.role === 'VOTER' ? 'Pemilih' : (user?.role || '-')}</p>
              </div>
              <div>
                <p className="text-caption text-on-surface-variant mb-1">Status Akun</p>
                <p className="font-body-bold text-on-surface">Aktif</p>
              </div>
            </div>
          </div>

          {/* Keamanan Akun Card */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant">
            <div className="flex items-center gap-3 mb-6 border-b border-outline-variant pb-4">
              <span className="material-symbols-outlined text-primary">security</span>
              <h3 className="font-h3 text-h3">Keamanan Akun</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-surface-container flex flex-col items-center text-center gap-2 border border-outline-variant/30">
                <span className="material-symbols-outlined text-primary text-[32px]">vpn_key</span>
                <p className="text-caption text-on-surface-variant">JWT Authentication</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-label font-label bg-secondary-container text-on-secondary-container">Aktif</span>
              </div>
              <div className="p-4 rounded-lg bg-surface-container flex flex-col items-center text-center gap-2 border border-outline-variant/30">
                <span className="material-symbols-outlined text-primary text-[32px]">fingerprint</span>
                <p className="text-caption text-on-surface-variant">RSA Public Key</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-label font-label ${user?.hasPublicKey ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-highest text-on-surface-variant'}`}>{user?.hasPublicKey ? 'Terdaftar' : 'Terdaftar'}</span>
              </div>
              <div className="p-4 rounded-lg bg-surface-container flex flex-col items-center text-center gap-2 border border-outline-variant/30">
                <span className="material-symbols-outlined text-primary text-[32px]">lock</span>
                <p className="text-caption text-on-surface-variant">Hybrid Encryption</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-label font-label bg-secondary-container text-on-secondary-container">Aktif</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          {/* Status Voting Card */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant overflow-hidden relative">
            {hasVotedState && (
              <div className="absolute top-0 right-0 p-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-label font-label bg-secondary-container text-on-secondary-container">Terverifikasi</span>
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">how_to_vote</span>
              <h3 className="font-h3 text-h3">Status Pemilihan</h3>
            </div>
            
            <div className="flex flex-col items-center justify-center py-6 text-center">
              {hasVotedState ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center mb-4 text-on-secondary-container">
                    <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  <p className="font-h2 text-h2 text-on-background mb-1">Sudah Memilih</p>
                  <p className="text-caption text-on-surface-variant mb-6">Hak pilih Anda telah digunakan dan tercatat dalam sistem.</p>
                  
                  <div className="w-full space-y-3 text-left bg-surface p-4 rounded-lg border border-outline-variant/40">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant">Waktu Memilih</p>
                      <p className="font-body text-body text-on-surface">Terekam di Sistem</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant">Verification Code</p>
                      <p className="font-body text-body font-mono text-[13px] break-all text-on-surface">Disimpan dengan Enkripsi</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 text-on-surface-variant border border-outline-variant">
                    <span className="material-symbols-outlined text-[36px]">pending_actions</span>
                  </div>
                  <p className="font-h2 text-h2 text-on-background mb-1">Belum Memilih</p>
                  <p className="text-caption text-on-surface-variant mb-6">Anda belum menggunakan hak pilih pada pemilihan aktif.</p>
                  <Link href="/dashboard/kandidat" className="px-6 py-2 bg-primary text-white font-body-bold rounded-lg hover:bg-primary-container transition-colors text-center block w-full">
                     Lihat Kandidat
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Aktivitas Terakhir */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">history</span>
              <h3 className="font-h3 text-h3">Aktivitas Terakhir</h3>
            </div>
            
            <div className="space-y-6 relative before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/30">
              
              {hasVotedState && (
                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 w-6 h-6 bg-secondary-container rounded-full border-4 border-surface-container-lowest flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-on-secondary-container rounded-full"></div>
                  </div>
                  <p className="font-body-bold text-on-surface leading-tight">Berhasil Memberikan Suara</p>
                  <p className="text-caption text-on-surface-variant">Sesi Saat Ini</p>
                </div>
              )}

              <div className="relative pl-8">
                <div className={`absolute left-0 top-1 w-6 h-6 ${!hasVotedState ? 'bg-primary-container' : 'bg-outline-variant'} rounded-full border-4 border-surface-container-lowest flex items-center justify-center`}>
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <p className="font-body-bold text-on-surface leading-tight">Login ke Sistem</p>
                <p className="text-caption text-on-surface-variant">Sesi Saat Ini</p>
              </div>

              <div className="relative pl-8 opacity-60">
                <div className="absolute left-0 top-1 w-6 h-6 bg-outline-variant rounded-full border-4 border-surface-container-lowest flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <p className="font-body-bold text-on-surface leading-tight">Registrasi Public Key</p>
                <p className="text-caption text-on-surface-variant">Sesi Sebelumnya</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row justify-end items-center gap-4 pt-8 border-t border-outline-variant">
        <button onClick={handleLogout} className="w-full md:w-auto px-8 py-3 rounded-lg font-bold text-error hover:bg-error/10 transition-colors flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">logout</span>
          Keluar
        </button>
        <Link href="/dashboard" className="w-full md:w-auto px-10 py-3 rounded-lg font-bold bg-primary text-white hover:bg-primary-container shadow-md transition-all active:scale-95 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">dashboard</span>
          Kembali ke Dashboard
        </Link>
      </div>

    </div>
  );
}
