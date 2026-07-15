'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Jika belum login, render children secara langsung (ditangani oleh protected route)
  if (!user) return <>{children}</>;

  const isActive = (path: string) => {
    return pathname === path 
      ? 'bg-primary-container text-on-primary-container font-body-bold' 
      : 'text-on-surface-variant font-body hover:bg-surface-container-high';
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard', fill: 1 },
    { name: 'Daftar Kandidat', path: '/dashboard/kandidat', icon: 'groups', fill: 0 },
    { name: 'Status Pemilihan', path: '/dashboard/status', icon: 'ballot', fill: 0 },
    { name: 'Hasil Pemilihan', path: '/dashboard/hasil', icon: 'analytics', fill: 0 },
    { name: 'Profil Saya', path: '/dashboard/profil', icon: 'person', fill: 0 },
  ];

  return (
    <div className="font-body text-body overflow-x-hidden min-h-screen bg-surface">
      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex flex-col h-screen w-[280px] fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-variant z-40 p-gutter">
        <div className="mb-10 px-2">
          <h1 className="font-h3 text-h3 font-bold text-primary">SuaraKu</h1>
          <p className="font-caption text-caption text-on-surface-variant opacity-70">Sistem E-Voting Mahasiswa</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(item.path)}`}
            >
              <span 
                className="material-symbols-outlined" 
                style={item.fill || pathname === item.path ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        
        <div className="mt-auto pt-6 border-t border-outline-variant space-y-2">

          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-error font-body hover:bg-error-container/20 rounded-lg transition-all"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="md:ml-[280px] min-h-screen flex flex-col">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 flex justify-between items-center px-container-padding w-full h-16 bg-surface shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-on-surface"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 border-outline-variant">
              <div className="text-right hidden sm:block">
                <p className="font-body-bold text-[14px]">{user.name}</p>
                <p className="font-caption text-[11px] text-on-surface-variant">Voter #{user.nim}</p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-primary-container bg-surface-container-high flex items-center justify-center overflow-hidden text-primary font-bold">
                 {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Canvas */}
        <div className="flex-1 pb-20 md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-lowest border-t border-outline-variant z-50 flex justify-around items-center px-2">
        {menuItems.slice(0, 4).map((item) => (
          <Link
            key={item.name}
            href={item.path}
            className={`flex flex-col items-center gap-1 ${pathname === item.path ? 'text-primary' : 'text-on-surface-variant'}`}
          >
            <span 
              className="material-symbols-outlined" 
              style={pathname === item.path ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-label">{item.name.split(' ')[0]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
