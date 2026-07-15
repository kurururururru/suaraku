'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

const loginSchema = z.object({
  nim: z.string().min(1, 'NIM/Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function VoterLoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', data);
      if (response.data.success) {
        if (response.data.data.user.role === 'ADMIN') {
          setError('Akses ditolak. Silakan gunakan portal khusus Panitia/Admin.');
        } else {
          login(response.data.data.token, response.data.data.user);
        }
      } else {
        setError(response.data.message || 'Login gagal. Periksa kembali kredensial Anda.');
      }
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Terjadi kesalahan pada server. Silakan coba lagi.');
    }
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="bg-surface text-on-background min-h-screen flex items-center justify-center p-gutter relative overflow-hidden font-body">
      <div className="absolute inset-0 bg-pattern pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <main className="w-full max-w-[420px] z-10">
        <div className="login-card bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm p-container-padding">

          <div className="flex flex-col items-center mb-stack-md text-center">
            <div className="w-16 h-16 mb-stack-md flex items-center justify-center">
              <img
                className="w-full h-full object-contain"
                alt="Logo SuaraKu"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8kr9WLODuHinfi7L7e5gwBA59RpDz1kxKFObBmhn2bFLS6WnZKyMiR5Oi9LydQ-6aWvcQMQDwAwNlfsona_kPrsVQLv3HxbrgGTZ4LD5ZyfTWlpqw730DBS9waxcvj6nklCXEIH4_fzjbT5Ba3bVrXLfCoX62OmiDOSK78wNmpqbIiBA4_rboj3jahkLN31N14kYciJK_vPJk9BrkHG_q2yWYSgFsdXc44PlQqQ-tnip7lGvpqXbv"
              />
            </div>
            <h1 className="font-h2 text-h2 text-on-surface mb-unit">E-Voting — Pemilihan Ketua Organisasi</h1>
            <p className="font-body text-body text-on-surface-variant">Masuk menggunakan akun terdaftar Anda</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-error-container border border-error/20 rounded-lg flex items-start gap-2">
              <span className="material-symbols-outlined text-[20px] text-error shrink-0 mt-0.5">error</span>
              <p className="text-sm text-on-error-container">{error}</p>
            </div>
          )}

          <form className="space-y-stack-md" onSubmit={handleSubmit(onSubmit)} autoComplete="off">

            <div className="space-y-unit">
              <label htmlFor="nim" className="font-label text-label text-on-surface-variant uppercase tracking-wider block">
                NIM / Username
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">person</span>
                <input
                  type="text"
                  id="nim"
                  {...register('nim')}
                  className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-lg font-body text-body text-on-surface placeholder:text-outline focus:border-primary-container input-focus-ring transition-all"
                  placeholder="Masukkan NIM Anda"
                  autoComplete="off"
                />
              </div>
              {errors.nim && <p className="mt-1 text-xs text-error">{errors.nim.message}</p>}
            </div>

            <div className="space-y-unit">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="font-label text-label text-on-surface-variant uppercase tracking-wider block">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  {...register('password')}
                  className="w-full pl-10 pr-12 py-3 bg-surface border border-outline-variant rounded-lg font-body text-body text-on-surface placeholder:text-outline focus:border-primary-container input-focus-ring transition-all"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined" id="eye-icon">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-error">{errors.password.message}</p>}
            </div>

            <div className="pt-unit">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-container text-on-primary text-body-bold font-body-bold py-3.5 rounded-lg shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-on-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="relative my-section-gap">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-outline-variant/50"></div>
            </div>
            <div className="relative flex justify-center text-caption font-caption">
              <span className="bg-surface-container-lowest px-4 text-outline uppercase tracking-widest">Informasi</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-on-surface-variant/80">
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
            <p className="font-caption text-caption">Sistem ini dilindungi enkripsi end-to-end</p>
          </div>
        </div>

        <footer className="mt-stack-md text-center">
          <p className="font-caption text-caption text-outline">
            © 2026 SuaraKu — Platform E-Voting Mahasiswa.<br />
            Divisi Pengembangan Teknologi Informasi.
          </p>
        </footer>
      </main>
    </div>
  );
}
