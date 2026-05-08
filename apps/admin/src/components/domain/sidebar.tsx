'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import {
  Trophy,
  Users,
  UserRound,
  Calendar,
  BarChart3,
  Shield,
  AlertTriangle,
  ListOrdered,
  GitBranch,
  Flag,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Torneos', href: '/tournaments', icon: Trophy },
  { name: 'Categorías', href: '/categories', icon: ListOrdered },
  { name: 'Equipos', href: '/teams', icon: Shield },
  { name: 'Jugadores', href: '/players', icon: UserRound },
  { name: 'Árbitros', href: '/referees', icon: Flag },
  { name: 'Partidos', href: '/matches', icon: Calendar },
  { name: 'Posiciones', href: '/standings', icon: BarChart3 },
  { name: 'Llaves', href: '/brackets', icon: GitBranch },
  { name: 'Estadísticas', href: '/statistics', icon: BarChart3 },
  { name: 'Sanciones', href: '/sanctions', icon: AlertTriangle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-brand-navy text-white flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* Tricolor shield */}
          <div className="w-10 h-10 rounded-xl overflow-hidden flex flex-col shadow-lg flex-shrink-0">
            <div className="flex-1 bg-brand-red" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-brand-blue" />
          </div>
          <div>
            <p className="font-bold text-sm text-white leading-tight">Fútbol Platform</p>
            <p className="text-xs text-slate-400">Panel de Administración</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-red text-white shadow-sm shadow-brand-red/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              )}
            >
              <item.icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user?.fullName?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
            <p className="text-xs text-slate-400 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
