'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { Modal } from '../../../components/ui/Modal';
import { Candidate } from '../../../types/election';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  AlertCircle,
  UserSquare2
} from 'lucide-react';

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    orderNumber: 0,
    name: '',
    currentRole: '',
    tagline: '',
    vision: '',
    mission: '',
    experience: '',
    photoUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/candidates');
      if (res.data.success) {
        setCandidates(res.data.data);
      }
    } catch {
      setError('Gagal memuat data kandidat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const openModal = (candidate?: Candidate) => {
    if (candidate) {
      setEditingId(candidate.id);
      setFormData({
        orderNumber: candidate.order_number,
        name: candidate.name,
        currentRole: candidate.current_role,
        tagline: candidate.tagline,
        vision: candidate.vision,
        mission: candidate.mission,
        experience: candidate.experience,
        photoUrl: candidate.photo_url || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        orderNumber: candidates.length + 1,
        name: '', currentRole: '', tagline: '', vision: '', mission: '', experience: '', photoUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/admin/candidates/${editingId}`, formData);
      } else {
        await api.post('/admin/candidates', formData);
      }
      setIsModalOpen(false);
      fetchCandidates();
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      alert(axiosError.response?.data?.message || 'Gagal menyimpan kandidat');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kandidat ini?')) return;
    try {
      await api.delete(`/admin/candidates/${id}`);
      fetchCandidates();
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      alert(axiosError.response?.data?.message || 'Gagal menghapus kandidat');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Manajemen Kandidat</h1>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Kandidat
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {candidates.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <UserSquare2 className="w-16 h-16 text-slate-300 mb-4" />
            <p className="font-medium text-lg">Belum ada kandidat terdaftar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">No</th>
                  <th className="px-6 py-4 font-bold">Kandidat</th>
                  <th className="px-6 py-4 font-bold">Jabatan / Visi Singkat</th>
                  <th className="px-6 py-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                        {c.order_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                          {c.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <UserSquare2 className="w-full h-full p-2 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{c.name}</p>
                          <p className="text-sm text-blue-600 font-medium">{c.current_role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 line-clamp-2 max-w-md">{c.vision}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openModal(c)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Kandidat" : "Tambah Kandidat"} maxWidth="2xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nomor Urut</label>
              <input type="number" required value={formData.orderNumber} onChange={e => setFormData({...formData, orderNumber: parseInt(e.target.value) || 0})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nama Lengkap</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Jabatan Saat Ini</label>
              <input type="text" required value={formData.currentRole} onChange={e => setFormData({...formData, currentRole: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tagline Singkat</label>
              <input type="text" value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Visi</label>
              <textarea rows={3} required value={formData.vision} onChange={e => setFormData({...formData, vision: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Misi</label>
              <textarea rows={3} required value={formData.mission} onChange={e => setFormData({...formData, mission: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Pengalaman</label>
              <textarea rows={2} required value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">URL Foto (Opsional)</label>
              <input type="url" value={formData.photoUrl} onChange={e => setFormData({...formData, photoUrl: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
            </div>
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
