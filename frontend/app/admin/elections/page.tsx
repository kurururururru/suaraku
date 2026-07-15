'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { Modal } from '../../../components/ui/Modal';
import { 
  Calendar, 
  Settings, 
  Play, 
  Square, 
  Share, 
  Edit, 
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trophy,
  BarChart3
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

interface Election {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'PENDING' | 'ACTIVE' | 'CLOSED' | 'RESULTS_PUBLISHED';
}

interface ResultsData {
  election: any;
  candidates: any[];
  winner: any;
}

export default function AdminElectionPage() {
  const [election, setElection] = useState<Election | null>(null);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({ title: '', description: '', startDate: '', endDate: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchElection = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/election');
      if (res.data.success) {
        const currElection = res.data.data;
        setElection(currElection);

        if (currElection.status === 'CLOSED' || currElection.status === 'RESULTS_PUBLISHED') {
          const resResults = await api.get(`/election/${currElection.id}/results`);
          if (resResults.data.success) {
            setResults(resResults.data.data);
          }
        } else {
          setResults(null);
        }
      }
    } catch (err) {
      const axiosError = err as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        setElection(null);
        setResults(null);
      } else {
        setError('Gagal memuat data pemilihan.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElection();
  }, []);

  const handleOpenModal = (mode: 'create' | 'edit') => {
    setModalMode(mode);
    if (mode === 'edit' && election) {
      setFormData({
        title: election.title,
        description: election.description,
        startDate: election.start_date.replace(' ', 'T'), // Format for datetime-local
        endDate: election.end_date.replace(' ', 'T')
      });
    } else {
      setFormData({ title: '', description: '', startDate: '', endDate: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveElection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate.replace('T', ' '),
        endDate: formData.endDate.replace('T', ' ')
      };

      if (modalMode === 'edit' && election) {
        await api.put(`/admin/election/${election.id}`, payload);
      } else {
        await api.post('/admin/election', payload);
      }
      setIsModalOpen(false);
      fetchElection();
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      alert(axiosError.response?.data?.message || 'Gagal menyimpan pemilihan');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (action: 'open' | 'close' | 'publish') => {
    if (!confirm(`Apakah Anda yakin ingin melakukan aksi ini?`)) return;
    try {
      await api.patch(`/admin/election/${action}`);
      fetchElection();
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      alert(axiosError.response?.data?.message || `Gagal mengubah status`);
    }
  };

  const renderResults = () => {
    if (!results) return null;
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mt-6 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Trophy className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Hasil Pemilihan</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={results.candidates}
                  dataKey="voteCount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                >
                  {results.candidates.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} Suara`, 'Perolehan']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
              <BarChart3 className="w-6 h-6 text-blue-500" /> Rincian Perolehan
            </h3>
            {results.candidates.map((c, i) => (
              <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: COLORS[i % COLORS.length]}}>
                    {c.orderNumber}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{c.name}</p>
                    <p className="text-sm text-slate-500">{c.percentage}% dari total suara</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-800">{c.voteCount}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase">Suara</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Manajemen Pemilihan</h1>
        {(!election || election.status === 'RESULTS_PUBLISHED') && (
          <button 
            onClick={() => handleOpenModal('create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Buat Pemilihan Baru
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {election ? (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide
                    ${election.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                      election.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                      election.status === 'CLOSED' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }
                  `}>
                    STATUS: {election.status}
                  </span>
                </div>
                <h2 className="text-3xl font-extrabold text-slate-800">{election.title}</h2>
              </div>
              
              <button 
                onClick={() => handleOpenModal('edit')}
                disabled={election.status !== 'PENDING'}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit className="w-4 h-4" /> Edit Detail
              </button>
            </div>

            <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-100">
              <p className="text-slate-600 mb-6">{election.description}</p>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
                    <Calendar className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Mulai</p>
                    <p className="font-medium text-slate-700">{new Date(election.start_date).toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
                    <Calendar className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Selesai</p>
                    <p className="font-medium text-slate-700">{new Date(election.end_date).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-white flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-400" /> Aksi Administratif
                </h3>
                <p className="text-sm text-slate-500">Pilih aksi di bawah ini untuk mengubah alur pemilihan secara permanen.</p>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                {election.status === 'PENDING' && (
                  <button 
                    onClick={() => updateStatus('open')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-500/20"
                  >
                    <Play className="w-4 h-4" /> Buka Voting
                  </button>
                )}
                {election.status === 'ACTIVE' && (
                  <button 
                    onClick={() => updateStatus('close')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-md shadow-red-500/20"
                  >
                    <Square className="w-4 h-4 fill-current" /> Tutup Voting
                  </button>
                )}
                {election.status === 'CLOSED' && (
                  <button 
                    onClick={() => updateStatus('publish')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-600/20"
                  >
                    <Share className="w-4 h-4" /> Publikasi Hasil
                  </button>
                )}
                {election.status === 'RESULTS_PUBLISHED' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-medium">
                    <CheckCircle2 className="w-5 h-5" /> Pemilihan Selesai
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {renderResults()}
        </>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center shadow-sm">
          <Calendar className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Pemilihan</h2>
          <p className="text-slate-500 mb-6">Buat acara pemilihan baru untuk memulai proses voting.</p>
        </div>
      )}

      {/* Modal Add/Edit */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={election ? "Edit Pemilihan" : "Buat Pemilihan Baru"} maxWidth="md">
        <form onSubmit={handleSaveElection} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Judul Pemilihan</label>
            <input 
              type="text" 
              required
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Contoh: Pemilihan BEM 2024"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Deskripsi</label>
            <textarea 
              rows={3}
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Waktu Mulai</label>
              <input 
                type="datetime-local" 
                required
                value={formData.startDate} 
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Waktu Selesai</label>
              <input 
                type="datetime-local" 
                required
                value={formData.endDate} 
                onChange={e => setFormData({...formData, endDate: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
              Batal
            </button>
            <button type="submit" disabled={submitting} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Simpan Data
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
