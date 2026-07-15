'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SuccessVotingPage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(15);
  const [receiptId, setReceiptId] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/votes/my-receipt', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setReceiptId(data.data.verificationCode);
          const date = new Date(data.data.votedAt);
          const optionsDate: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
          const optionsTime: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
          const dateStr = date.toLocaleDateString('id-ID', optionsDate);
          const timeStr = date.toLocaleTimeString('id-ID', optionsTime).replace(/\./g, ':');
          setTimestamp(`${dateStr} • ${timeStr} WIB`);
        }
      } catch (err) {
        console.error("Failed to fetch receipt", err);
      }
    };
    fetchReceipt();

    // Timer logic
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  // Confetti Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: any[] = [];
    const colors = ['#3730A3', '#006C4A', '#82F5C1', '#A9A7FF'];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 3 + 2,
        angle: Math.random() * 6.28,
        rotation: Math.random() * 0.2
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.y += p.speed;
        p.angle += p.rotation;
        if (p.y > height) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(receiptId);
    alert("ID Bukti Pemilihan disalin: " + receiptId);
  };

  return (
    <>
      <style>{`
        .success-checkmark-animation {
          animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
      `}</style>
      
      <div className="relative flex flex-col flex-grow min-h-[calc(100vh-64px)] w-full items-center justify-center p-container-padding overflow-x-hidden">
        <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />
        
        {/* Subtle Background Decoration */}
        <div className="fixed inset-0 overflow-hidden -z-10 opacity-40 pointer-events-none">
          <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full bg-primary-fixed mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-secondary-fixed mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <main className="w-full max-w-2xl flex flex-col items-center text-center space-y-stack-md z-10 relative mt-section-gap mb-24">
          {/* Success Icon Section */}
          <div className="relative flex items-center justify-center w-32 h-32 mb-stack-md">
            <div className="absolute inset-0 bg-secondary-container/30 rounded-full animate-ping opacity-25"></div>
            <div className="relative bg-secondary-container rounded-full w-24 h-24 flex items-center justify-center shadow-md success-checkmark-animation">
              <span className="material-symbols-outlined text-[80px] text-on-secondary-container" style={{ fontVariationSettings: "'wght' 600" }}>check_circle</span>
            </div>
          </div>

          {/* Heading & Description */}
          <div className="space-y-stack-sm max-w-lg">
            <h1 className="font-h1 text-h1 text-on-background tracking-tight">Suara Anda Berhasil Direkam!</h1>
            <p className="font-body text-body text-on-surface-variant leading-relaxed">
              Terima kasih telah berpartisipasi dalam pemilihan raya mahasiswa. Pilihan Anda telah dienkripsi menggunakan protokol keamanan tingkat tinggi dan disimpan secara anonim dalam basis data terdistribusi kami.
            </p>
          </div>

          {/* Bento Information Card */}
          <div className="w-full mt-section-gap grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* Receipt Details */}
            <div className="md:col-span-3 glass-card rounded-xl p-container-padding shadow-sm bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-gutter">
              <div className="space-y-1">
                <span className="font-label text-label text-on-surface-variant uppercase opacity-70">ID Bukti Pemilihan</span>
                <div className="flex items-center gap-2">
                  <span className="font-body-bold text-body-bold text-primary font-mono select-all">{receiptId || 'Memuat...'}</span>
                  <button onClick={handleCopy} className="material-symbols-outlined text-primary-container p-1 hover:bg-primary-fixed rounded transition-colors" title="Salin ID">content_copy</button>
                </div>
              </div>
              <div className="h-px md:h-12 w-full md:w-px bg-outline-variant/30"></div>
              <div className="space-y-1">
                <span className="font-label text-label text-on-surface-variant uppercase opacity-70">Waktu Transaksi</span>
                <p className="font-body-bold text-body-bold">{timestamp || 'Memuat...'}</p>
              </div>
              <div className="h-px md:h-12 w-full md:w-px bg-outline-variant/30"></div>
              <div className="flex items-center gap-3 bg-secondary-container/50 px-4 py-2 rounded-full">
                <span className="material-symbols-outlined text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="font-label text-label text-on-secondary-container">Terenkripsi &amp; Tersimpan</span>
              </div>
            </div>

            {/* Secondary Info Pills */}
            <div className="glass-card rounded-xl p-stack-md flex items-center gap-4 bg-surface-container-low/50">
              <div className="bg-primary-container/10 p-2 rounded-lg shrink-0">
                <span className="material-symbols-outlined text-primary-container">lock</span>
              </div>
              <div>
                <p className="font-body-bold text-[14px]">AES-256 Bit</p>
                <p className="font-caption text-caption text-on-surface-variant">Standard Enkripsi</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-stack-md flex items-center gap-4 bg-surface-container-low/50">
              <div className="bg-primary-container/10 p-2 rounded-lg shrink-0">
                <span className="material-symbols-outlined text-primary-container">visibility_off</span>
              </div>
              <div>
                <p className="font-body-bold text-[14px]">Anonimitas</p>
                <p className="font-caption text-caption text-on-surface-variant">Identitas Terpisah</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-stack-md flex items-center gap-4 bg-surface-container-low/50">
              <div className="bg-primary-container/10 p-2 rounded-lg shrink-0">
                <span className="material-symbols-outlined text-primary-container">account_balance</span>
              </div>
              <div>
                <p className="font-body-bold text-[14px]">Audit-Ready</p>
                <p className="font-caption text-caption text-on-surface-variant">Transparansi Publik</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-section-gap w-full">
            <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-primary text-on-primary font-body-bold rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2">
              <span>Kembali ke Dashboard</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>

          <p className="pt-stack-md font-caption text-caption text-on-surface-variant/60">
            Sesi pemilihan ini akan berakhir otomatis dalam <span className="font-mono font-bold">00:{timeLeft.toString().padStart(2, '0')}</span> detik.
          </p>
        </main>
      </div>
    </>
  );
}
