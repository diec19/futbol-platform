'use client';

import { useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
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
  Building2,
  Newspaper,
  Bell,
  Image,
  MapPin,
  CreditCard,
  ChevronDown,
  Shirt,
  Layers,
  Banknote,
  Handshake,
  Gift,
  MonitorPlay,
  UserPlus,
  UserMinus,
} from 'lucide-react';

const clubGeneralNav = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Info del Club', href: '/club', icon: Building2 },
  { name: 'Noticias', href: '/club/news', icon: Newspaper },
  { name: 'Galería', href: '/club/gallery', icon: Image },
  { name: 'Canchas', href: '/club/fields', icon: MapPin },
];

const clubPlayersNav = [
  { name: 'Categorías', href: '/club/categorias', icon: Layers },
  { name: 'Plantel', href: '/club/plantel', icon: Shirt },
  { name: 'Socios', href: '/club/members', icon: Users },
  { name: 'Altas de jugadores', href: '/club/join-requests', icon: UserPlus },
  { name: 'Desvinculaciones', href: '/club/unlink-requests', icon: UserMinus },
  { name: 'Cuerpo Técnico', href: '/club/staff', icon: Users },
];

const clubFinanceNav = [
  { name: 'Cuotas', href: '/club/cuotas', icon: Banknote },
  { name: 'Pagos', href: '/club/payments', icon: CreditCard },
  { name: 'Auspiciantes', href: '/club/sponsors', icon: Handshake },
  { name: 'Banners', href: '/club/banners', icon: MonitorPlay },
  { name: 'Beneficios', href: '/club/benefits', icon: Gift },
];

const clubCommsNav = [
  { name: 'Notificaciones', href: '/club/notifications', icon: Bell },
];

const tournamentNav = [
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

function isItemActive(href: string, pathname: string): boolean {
  return pathname === href || (href !== '/' && pathname.startsWith(href));
}

interface NavItemProps {
  item: { name: string; href: string; icon: typeof Trophy };
  pathname: string;
  onNavigate?: () => void;
}

function NavItem({ item, pathname, onNavigate }: NavItemProps) {
  const isActive = isItemActive(item.href, pathname);

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className={cn(
        'w-full justify-start gap-3 px-3 font-medium text-slate-400 hover:bg-white/10 hover:text-white',
        isActive && 'bg-brand-red text-white shadow-sm shadow-brand-red/30 hover:bg-brand-red hover:text-white'
      )}
    >
      <Link href={item.href} onClick={onNavigate} className="w-full">
        <item.icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
        <span className="truncate">{item.name}</span>
      </Link>
    </Button>
  );
}

function NavSection({
  label,
  items,
  pathname,
  defaultOpen = true,
  bordered = false,
  onNavigate,
}: {
  label: string;
  items: { name: string; href: string; icon: typeof Trophy }[];
  pathname: string;
  defaultOpen?: boolean;
  bordered?: boolean;
  onNavigate?: () => void;
}) {
  const hasActive = items.some((i) => isItemActive(i.href, pathname));
  const [open, setOpen] = useState(defaultOpen || hasActive);

  return (
    <div className={cn(bordered && 'border-t border-white/10 pt-3')}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-3 py-1.5 group"
      >
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-slate-300 transition-colors">
          {label}
        </span>
        <ChevronDown
          size={13}
          className={cn(
            'text-slate-600 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          open ? 'max-h-[600px] opacity-100 mt-0.5' : 'max-h-0 opacity-0'
        )}
      >
        <div className="space-y-0.5 pb-1">
          {items.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className={cn('w-64 min-h-screen bg-brand-navy text-white flex flex-col', className)}>
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <NextImage
            src="/logo.png"
            alt="Club logo"
            width={44}
            height={44}
            className="rounded-full flex-shrink-0 shadow-lg"
          />
          <div>
            <p className="font-bold text-sm text-white leading-tight">Club DM</p>
            <p className="text-xs text-slate-400">Panel de Administración</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-1">
        <NavSection
          label="Mi Club"
          items={clubGeneralNav}
          pathname={pathname}
          defaultOpen={true}
          onNavigate={onNavigate}
        />
        <NavSection
          label="Jugadores y Categorías"
          items={clubPlayersNav}
          pathname={pathname}
          defaultOpen={true}
          onNavigate={onNavigate}
        />
        <NavSection
          label="Finanzas"
          items={clubFinanceNav}
          pathname={pathname}
          defaultOpen={false}
          onNavigate={onNavigate}
        />
        <NavSection
          label="Comunicación"
          items={clubCommsNav}
          pathname={pathname}
          defaultOpen={false}
          onNavigate={onNavigate}
        />
        <NavSection
          label="Torneos"
          items={tournamentNav}
          pathname={pathname}
          defaultOpen={false}
          bordered
          onNavigate={onNavigate}
        />
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
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-white/10"
        >
          <LogOut size={15} />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
