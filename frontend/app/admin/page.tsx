'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { 
  Users, 
  UserCheck, 
  UserSquare2, 
  Activity,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface AdminStats {
  totalVoters: number;
  totalCandidates: number;
  votesIn: number;
  participationRate: number;
  electionStatus: string;
}

interface TimelineItem {
  hour: string;
  count: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [statsRes, timelineRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/participation-timeline')
        ]);

        if (statsRes.data.success) setStats(statsRes.data.data);
        if (timelineRes.data.success) {
          // Format timeline for chart
          const formatted = timelineRes.data.data.map((item: { hour: string; count: number }) => ({
            time: new Date(item.hour).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            Suara: item.count
          }));
          setTimeline(formatted);
        }
      } catch (err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || 'Gagal memuat statistik.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-2xl flex items-center gap-3">
        <AlertCircle className="w-6 h-6" />
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Pemilih',
      value: stats?.totalVoters || 0,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Suara Masuk',
      value: stats?.votesIn || 0,
      icon: UserCheck,
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Tingkat Partisipasi',
      value: `${stats?.participationRate.toFixed(1) || 0}%`,
      icon: Activity,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Kandidat',
      value: stats?.totalCandidates || 0,
      icon: UserSquare2,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Overview Dashboard</h1>
        <div className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold border border-slate-200">
          Status Pemilihan: <span className="text-blue-600 ml-1">{stats?.electionStatus || 'NONE'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`p-4 rounded-xl ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{card.title}</p>
                <p className="text-2xl font-black text-slate-800">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" /> Grafik Partisipasi Pemilih
        </h2>
        
        {timeline.length > 0 ? (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Suara" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[400px] w-full flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 border-dashed">
            <p className="text-slate-500">Belum ada data partisipasi.</p>
          </div>
        )}
      </div>
    </div>
  );
}
