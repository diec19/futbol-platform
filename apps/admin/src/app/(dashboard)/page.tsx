'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
  Trophy, Users, UserRound, Calendar, Zap,
  AlertTriangle, ListOrdered, Plus, ArrowRight,
  Shield, TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { TOURNAMENT_STATUS_LABELS, MATCH_STATUS_LABELS } from '@futbol/constants';
import { useAuth } from '@/providers/auth-provider';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border border-green-200',
  DRAFT: 'bg-gray-100 text-gray-500 border border-gray-200',
  SUSPENDED: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  FINISHED: 'bg-blue-100 text-blue-700 border border-blue-200',
};

const MATCH_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-gray-100 text-gray-600',
  LIVE: 'bg-green-100 text-green-700',
  FINISHED: 'bg-blue-100 text-blue-700',
  POSTPONED: 'bg-yellow-100 text-yellow-700',
};

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  bg: string;
  text: string;
  href?: string;
}

function StatCard({ label, value, icon: Icon, bg, text, href }: StatCardProps) {
  const inner = (
    <div className={`rounded-xl p-5 flex items-center gap-4 group ${bg}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/20`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/80">{label}</p>
        <p className="text-3xl font-extrabold text-white mt-0.5">{value}</p>
      </div>
      {href && (
        <ArrowRight size={16} className="text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
      )}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: globalStats } = useQuery({
    queryKey: ['stats-global'],
    queryFn: () => api.statistics.global(),
  });

  const { data: tournamentsRes } = useQuery({
    queryKey: ['tournaments-dashboard'],
    queryFn: () => api.tournaments.list({ limit: '6', status: 'ACTIVE' }),
  });

  const { data: allTournamentsRes } = useQuery({
    queryKey: ['tournaments-all-dash'],
    queryFn: () => api.tournaments.list({ limit: '50' }),
  });

  const { data: matchesRes } = useQuery({
    queryKey: ['matches-upcoming'],
    queryFn: () => api.matches.list({ status: 'SCHEDULED', limit: '6' }),
  });

  const { data: recentRes } = useQuery({
    queryKey: ['matches-recent'],
    queryFn: () => api.matches.list({ status: 'FINISHED', limit: '5' }),
  });

  const stats = globalStats?.data;
  const activeTournaments = tournamentsRes?.data ?? [];
  const allTournaments = allTournamentsRes?.data ?? [];
  const upcomingMatches = matchesRes?.data ?? [];
  const recentMatches = recentRes?.data ?? [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="space-y-8 max-w-7xl">

      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg">
        {/* Tricolor stripe */}
        <div className="absolute inset-0 flex">
          <div className="flex-1 bg-brand-red" />
          <div className="w-px bg-white/20" />
          <div className="flex-1 bg-white" />
          <div className="w-px bg-white/20" />
          <div className="flex-1 bg-brand-blue" />
        </div>
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-red via-brand-red/80 to-brand-blue/90" />

        <div className="relative z-10 px-8 py-8 flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium">{greeting}, {user?.fullName?.split(' ')[0]}</p>
            <h1 className="text-3xl font-extrabold text-white mt-1 tracking-tight">
              Panel de Control
            </h1>
            <p className="text-white/70 text-sm mt-2">
              {stats?.activeTournaments
                ? `${stats.activeTournaments} torneo${stats.activeTournaments > 1 ? 's' : ''} activo${stats.activeTournaments > 1 ? 's' : ''} · ${stats.matchesPlayed} partidos jugados · ${stats.goals} goles`
                : 'Cargando estadísticas...'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Tricolor shield logo */}
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 flex flex-col">
              <div className="flex-1 bg-brand-red" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-brand-blue" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Torneos"
          value={stats?.tournaments ?? '—'}
          icon={Trophy}
          bg="bg-brand-red"
          text="text-white"
          href="/tournaments"
        />
        <StatCard
          label="Equipos"
          value={stats?.teams ?? '—'}
          icon={Shield}
          bg="bg-brand-blue"
          text="text-white"
          href="/teams"
        />
        <StatCard
          label="Jugadores"
          value={stats?.players ?? '—'}
          icon={UserRound}
          bg="bg-brand-navy-mid"
          text="text-white"
          href="/players"
        />
        <StatCard
          label="Partidos jugados"
          value={stats?.matchesPlayed ?? '—'}
          icon={Calendar}
          bg="bg-slate-600"
          text="text-white"
          href="/matches"
        />
        <StatCard
          label="Goles totales"
          value={stats?.goals ?? '—'}
          icon={Zap}
          bg="bg-rose-500"
          text="text-white"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Nuevo torneo', href: '/tournaments/new', icon: Trophy, color: 'text-brand-red', bg: 'bg-brand-red-light hover:bg-red-100 border-brand-red/20' },
          { label: 'Nueva categoría', href: '/tournaments', icon: ListOrdered, color: 'text-brand-blue', bg: 'bg-brand-blue-light hover:bg-blue-100 border-brand-blue/20' },
          { label: 'Ver partidos', href: '/matches', icon: Calendar, color: 'text-slate-600', bg: 'bg-slate-50 hover:bg-slate-100 border-slate-200' },
          { label: 'Sanciones', href: '/sanctions', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200' },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors ${action.bg}`}
          >
            <action.icon size={16} className={action.color} />
            <span className={`text-sm font-medium ${action.color}`}>{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Active Tournaments — 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-xl border overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-brand-red" />
              <h2 className="font-semibold text-gray-900">Torneos activos</h2>
              {stats?.activeTournaments != null && (
                <span className="text-xs bg-brand-red-light text-brand-red font-bold px-2 py-0.5 rounded-full">
                  {stats.activeTournaments}
                </span>
              )}
            </div>
            <Link href="/tournaments" className="text-xs text-gray-400 hover:text-brand-red transition-colors flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>

          {activeTournaments.length === 0 ? (
            <div className="p-8 text-center">
              <Trophy size={32} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">No hay torneos activos</p>
              <Link href="/tournaments/new" className="inline-flex items-center gap-1.5 mt-3 text-sm text-brand-red font-medium hover:underline">
                <Plus size={13} /> Crear torneo
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {activeTournaments.map((t: any) => (
                <Link
                  key={t.id}
                  href={`/tournaments/${t.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex flex-col flex-shrink-0 shadow-sm">
                      <div className="flex-1 bg-brand-red" />
                      <div className="flex-1 bg-white border-y border-gray-100" />
                      <div className="flex-1 bg-brand-blue" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-brand-red transition-colors text-sm">
                        {t.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(t.startDate)} → {formatDate(t.endDate)}
                        {t.sponsor ? ` · ${t.sponsor}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{t.categories?.length ?? 0} categorías</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[t.status] ?? ''}`}>
                      {TOURNAMENT_STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Non-active tournaments summary */}
          {allTournaments.filter((t: any) => t.status !== 'ACTIVE').length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {allTournaments.filter((t: any) => t.status === 'DRAFT').length} en borrador ·{' '}
                  {allTournaments.filter((t: any) => t.status === 'FINISHED').length} finalizados
                </p>
                <Link href="/tournaments" className="text-xs text-brand-blue hover:underline flex items-center gap-1">
                  Ver todos <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right column — 2 cols */}
        <div className="lg:col-span-2 space-y-6">

          {/* Upcoming matches */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-brand-blue" />
                <h2 className="font-semibold text-gray-900 text-sm">Próximos partidos</h2>
              </div>
              <Link href="/matches" className="text-xs text-gray-400 hover:text-brand-blue transition-colors">
                Ver todos →
              </Link>
            </div>

            {upcomingMatches.length === 0 ? (
              <p className="p-5 text-sm text-gray-400 text-center">Sin partidos programados</p>
            ) : (
              <div className="divide-y">
                {upcomingMatches.map((m: any) => (
                  <div key={m.id} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-400">{formatDateTime(m.scheduledAt)}</p>
                      {m.group && <p className="text-xs text-gray-300">{m.group.name}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-700 flex-1 truncate">{m.homeTeam?.name}</p>
                      <span className="text-xs font-bold text-gray-300 px-1">vs</span>
                      <p className="text-sm font-medium text-gray-700 flex-1 truncate text-right">{m.awayTeam?.name}</p>
                    </div>
                    {m.venue && <p className="text-xs text-gray-300 mt-0.5 truncate">📍 {m.venue}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent results */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-rose-500" />
                <h2 className="font-semibold text-gray-900 text-sm">Resultados recientes</h2>
              </div>
            </div>

            {recentMatches.length === 0 ? (
              <p className="p-5 text-sm text-gray-400 text-center">Sin resultados aún</p>
            ) : (
              <div className="divide-y">
                {recentMatches.map((m: any) => (
                  <div key={m.id} className="px-5 py-3">
                    <p className="text-xs text-gray-400 mb-1">{formatDate(m.scheduledAt)}</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm flex-1 truncate font-medium ${m.homeScore > m.awayScore ? 'text-gray-900' : 'text-gray-400'}`}>
                        {m.homeTeam?.name}
                      </p>
                      <span className="text-sm font-extrabold text-gray-900 px-2 py-0.5 bg-gray-100 rounded-md tabular-nums">
                        {m.homeScore} - {m.awayScore}
                      </span>
                      <p className={`text-sm flex-1 truncate font-medium text-right ${m.awayScore > m.homeScore ? 'text-gray-900' : 'text-gray-400'}`}>
                        {m.awayTeam?.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Alert: pending sanctions */}
      {stats?.sanctions > 0 && (
        <Link
          href="/sanctions"
          className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-xl px-6 py-4 hover:bg-amber-100 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">
              {stats.sanctions} sanción{stats.sanctions > 1 ? 'es' : ''} pendiente{stats.sanctions > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Hay sanciones activas sin resolver. Hacé clic para gestionarlas.
            </p>
          </div>
          <ArrowRight size={16} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

    </div>
  );
}
