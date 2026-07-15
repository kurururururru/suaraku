'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { Loader2, AlertCircle, FileText, Search, Filter, ShieldAlert } from 'lucide-react';

interface AuditLog {
  id: number;
  action: string;
  user_id: number;
  metadata: string;
  ip_address: string;
  created_at: string;
  user_name: string | null;
  user_role: string | null;
  user_nim: string | null;
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchLogs = async (pageNumber: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/admin/audit-logs?page=${pageNumber}&limit=20`);
      if (res.data.success) {
        setLogs(res.data.data.logs);
        setPage(res.data.data.pagination.page);
        setTotalPages(res.data.data.pagination.totalPages);
        setTotalItems(res.data.data.pagination.total);
      }
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Gagal memuat log audit.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ');
  };

  const getActionColor = (action: string) => {
    if (action.includes('ERROR') || action.includes('INVALID') || action.includes('DELETED')) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    if (action.includes('LOGIN') || action.includes('CREATED') || action.includes('REGISTERED')) {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
    if (action.includes('SUBMITTED') || action.includes('UPDATED')) {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" /> Audit Log System
          </h1>
          <p className="text-slate-500 mt-1">Pantau seluruh aktivitas pengguna dan sistem secara real-time.</p>
        </div>
        <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
          <p className="text-sm font-bold text-slate-600 uppercase">Total Rekaman</p>
          <p className="text-xl font-black text-slate-800">{totalItems}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-bold text-slate-700">Log Keamanan & Sistem</span>
          </div>
          <button 
            onClick={() => fetchLogs(1)}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
          >
            Refresh Data
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 font-bold">Waktu</th>
                <th className="p-4 font-bold">Aksi</th>
                <th className="p-4 font-bold">Pelaku (User)</th>
                <th className="p-4 font-bold max-w-[200px]">Detail (Metadata)</th>
                <th className="p-4 font-bold">IP Address</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    Tidak ada data log.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 whitespace-nowrap text-slate-500 font-medium">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md border ${getActionColor(log.action)}`}>
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td className="p-4">
                      {log.user_name ? (
                        <div>
                          <p className="font-bold text-slate-800">{log.user_name}</p>
                          <p className="text-xs text-slate-500">{log.user_nim} • {log.user_role}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">System / Unknown</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="max-w-[300px] overflow-hidden text-ellipsis bg-slate-100 p-2 rounded-lg border border-slate-200 font-mono text-xs text-slate-600">
                        {log.metadata}
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-xs">
                      {log.ip_address || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <p className="text-sm text-slate-500">
            Halaman <span className="font-bold text-slate-800">{page}</span> dari <span className="font-bold text-slate-800">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1 || loading}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
            >
              Sebelumnya
            </button>
            <button
              disabled={page === totalPages || loading || totalPages === 0}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
