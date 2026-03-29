'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  LogOut,
  LayoutDashboard,
  FileText,
  LineChart,
  MessageCircle,
  User,
  LucideIcon,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useAppStore } from '@/lib/store';

interface TopBarProps {
  title?: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const router = useRouter();
  const resetSessionState = useAppStore((state) => state.resetSessionState);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    resetSessionState();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <header className="h-20 flex items-center justify-between px-8 bg-white/50 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant/10">
      <div className="flex flex-col">
        {subtitle && (
          <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">
            {subtitle}
          </h2>
        )}
        {title && <p className="text-lg font-headline font-bold text-primary">{title}</p>}
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={handleSignOut}
          className="p-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}

export function Sidebar({ isCollapsed, toggleSidebar }: { isCollapsed: boolean; toggleSidebar: () => void }) {
  const pathname = usePathname();
  const userProfile = useAppStore((state) => state.userProfile);
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/plan', icon: FileText, label: 'Plan' },
    { path: '/simulate', icon: LineChart, label: 'Simulate' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <aside className={`fixed top-0 left-0 h-full bg-white border-r border-outline-variant/30 flex flex-col z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'px-2 py-4 justify-center' : 'p-6 justify-between'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-black text-xl">A</span>
          </div>
          <span
            className={`text-xl font-extrabold tracking-tight text-primary whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}
          >
            ARTHA AI
          </span>
        </div>
        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex w-8 h-8 rounded-full hover:bg-surface-container-low items-center justify-center text-on-surface-variant transition-colors"
          >
            <ChevronLeft
              size={20}
              className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
        )}
        {isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex w-8 h-8 rounded-full hover:bg-surface-container-low items-center justify-center text-on-surface-variant transition-colors absolute right-0"
          >
            <ChevronLeft
              size={20}
              className="transition-transform duration-300 rotate-180"
            />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon as LucideIcon;
          return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-4 px-3 py-3 rounded-md transition-all ${isActive ? 'bg-primary-container/10 text-primary border border-primary/10' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <Icon size={18} className="shrink-0" />
            <span className={`font-bold text-sm tracking-wide whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              {item.label.toUpperCase()}
            </span>
          </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-outline-variant/20">
        <div className={`flex items-center gap-3 p-2 hover:bg-surface-container-low rounded-md cursor-pointer transition-all ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden shrink-0">
            <Image
              alt="User"
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop"
              width={40}
              height={40}
            />
          </div>
          <div className={`overflow-hidden transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
            <p className="font-bold text-sm text-on-surface truncate">{userProfile?.name || 'Account'}</p>
            <p className="text-xs text-on-surface-variant truncate">{userProfile ? 'Member' : 'Not onboarded'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function AppLayout({ children, sidebar = true }: { children: React.ReactNode; sidebar?: boolean }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-background text-on-background font-body">
      {sidebar && <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />}
      <div className={`flex-1 transition-all duration-300 flex flex-col ${sidebar ? (isSidebarCollapsed ? 'ml-20' : 'ml-64') : ''}`}>
        {children}
      </div>
    </div>
  );
}
