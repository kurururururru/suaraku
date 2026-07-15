'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import { ShieldCheck, Lock, AlertCircle, Loader2, UserCog } from 'lucide-react';

const loginSchema = z.object({
  nim: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

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
        if (response.data.data.user.role !== 'ADMIN') {
          setError('Akses ditolak. Akun ini tidak memiliki hak akses administrator.');
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

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ornaments - darker/more intense for admin */}
      <div className="absolute top-[10%] right-[10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>
      <div className="absolute bottom-[10%] left-[10%] w-96 h-96 bg-rose-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-10"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-rose-500 to-amber-500"></div>

          <div className="flex flex-col items-center mb-8">
            <div className="bg-purple-500/10 p-4 rounded-2xl mb-4 border border-purple-500/20 rotate-3 transition-transform hover:rotate-0 duration-300">
              <ShieldCheck className="w-12 h-12 text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Admin Console</h1>
            <p className="text-slate-400 mt-2 text-sm flex items-center gap-2">
              <UserCog className="w-4 h-4" /> SuaraKu Administration
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in-95 duration-200">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Admin Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCog className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  {...register('nim')}
                  className="block w-full pl-10 pr-3 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                  placeholder="admin"
                  autoComplete="off"
                />
              </div>
              {errors.nim && <p className="mt-1.5 text-sm text-red-400">{errors.nim.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Secure Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  {...register('password')}
                  className="block w-full pl-10 pr-3 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              {errors.password && <p className="mt-1.5 text-sm text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-slate-950 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 group"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                  Authenticating...
                </>
              ) : (
                <>
                  Masuk Sistem
                  <Lock className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
