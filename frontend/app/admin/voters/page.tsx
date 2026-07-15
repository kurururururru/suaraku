'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { Modal } from '../../../components/ui/Modal';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface Voter {
  id: number;
  nim: string;
  name: string;
  has_voted: number;
  voted_at: string | null;
  created_at: string;
}

export default function AdminVotersPage() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nim: '', name: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchVoters = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/admin/voters?${params.toString()}`);
      if (res.data.success) {
        setVoters(res.data.data.voters);
        setPagination(res.data.data.pagination);
      }
    } catch {
      setError('Gagal memuat data pemilih.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchVoters(1);
    }, 500);
    return () => clearTimeout(delayDebounce);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const openModal = (voter?: Voter) => {
    if (voter) {
      setEditingId(voter.id);
      setFormData({ nim: voter.nim, name: voter.name, password: '' }); // Leave password empty
    } else {
      setEditingId(null);
      setFormData({ nim: '', name: '', password: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        const payload: { nim: string; name: string; password?: string } = { nim: formData.nim, name: formData.name };
        if (formData.password) payload.password = formData.password;
        await api.put(`/admin/voters/${editingId}`, payload);
      } else {
        await api.post('/admin/voters', formData);
      }
      setIsModalOpen(false);
      fetchVoters(pagination.page);
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      alert(axiosError.response?.data?.message || 'Gagal menyimpan data pemilih');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (voter: Voter) => {
    if (voter.has_voted === 1) {
      alert('Tidak bisa menghapus pemilih yang sudah memberikan suara.');
      return;
    }
    if (!confirm('Apakah Anda yakin ingin menghapus pemilih ini?')) return;
    try {
      await api.delete(`/admin/voters/${voter.id}`);
      fetchVoters(pagination.page);
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      alert(axiosError.response?.data?.message || 'Gagal menghapus pemilih');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Manajemen Pemilih</h1>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Pemilih
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari NIM atau Nama..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-700"
        >
          <option value="">Semua Status</option>
          <option value="voted">Sudah Memilih</option>
          <option value="not_voted">Belum Memilih</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading && voters.length === 0 ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
        ) : voters.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Users className="w-16 h-16 text-slate-300 mb-4" />
            <p className="font-medium text-lg">Tidak ada data pemilih yang sesuai.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">NIM</th>
                  <th className="px-6 py-4 font-bold">Nama Pemilih</th>
                  <th className="px-6 py-4 font-bold">Status Vote</th>
                  <th className="px-6 py-4 font-bold">Terdaftar</th>
                  <th className="px-6 py-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {voters.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-slate-600">{v.nim}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{v.name}</td>
                    <td className="px-6 py-4">
                      {v.has_voted === 1 ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold bg-emerald-50 w-max px-2.5 py-1 rounded-md border border-emerald-100">
                          <CheckCircle2 className="w-4 h-4" /> Sudah Memilih
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400 text-sm font-bold bg-slate-50 w-max px-2.5 py-1 rounded-md border border-slate-200">
                          <XCircle className="w-4 h-4" /> Belum
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(v.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openModal(v)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(v)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" disabled={v.has_voted === 1}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Menampilkan Halaman <span className="font-bold text-slate-800">{pagination.page}</span> dari <span className="font-bold text-slate-800">{pagination.totalPages}</span>
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={pagination.page <= 1}
                onClick={() => fetchVoters(pagination.page - 1)}
                className="p-1.5 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchVoters(pagination.page + 1)}
                className="p-1.5 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Pemilih" : "Tambah Pemilih Baru"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">NIM / ID Pengguna</label>
            <input 
              type="text" 
              required 
              value={formData.nim} 
              onChange={e => setFormData({...formData, nim: e.target.value})} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Contoh: 2021001"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nama Lengkap</label>
            <input 
              type="text" 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Password {editingId && <span className="text-slate-400 font-normal">(Kosongkan jika tidak ingin mengubah)</span>}
            </label>
            <input 
              type="password" 
              required={!editingId}
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
              Batal
            </button>
            <button type="submit" disabled={submitting} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
