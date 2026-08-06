'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Shirt, Layers, Users, Banknote, CheckCircle2,
  Clock, AlertTriangle, ArrowRight, Plus, Building2,
} from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ActiveBadge } from '@/components/domain/status-badge';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function StatCard({ label, value, icon: Icon, color, href }: {
  label: string; value: number | string; icon: React.ElementType; color: string; href?: string;
}) {
  const inner = (
    <div className={`rounded-xl p-5 flex items-center gap-4 ${color}`}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/80">{label}</p>
        <p className="text-3xl font-extrabold text-white mt-0.5">{value}</p>
      </div>
      {href && <ArrowRight size={16} className="text-white/50" />}
    </div>
  );
  return href ? <Link href={href} className="group" aria-label={label}>{inner}</Link> : <div>{inner}</div>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const clubQuery = useQuery({ queryKey: ['club'], queryFn: api.club.get });
  const categoriesQuery = useQuery({ queryKey: ['club-categories'], queryFn: api.club.categories.list });
  const playersQuery = useQuery({
    queryKey: ['plantel-dash'],
    queryFn: () => api.players.list({ isClubPlayer: 'true', limit: '500' }),
  });
  const membersQuery = useQuery({ queryKey: ['members-dash'], queryFn: api.members.list });
  const cuotasQuery = useQuery({
    queryKey: ['cuotas-dash', month, year],
    queryFn: () => api.players.subscriptions.all({ month: String(month), year: String(year) }),
  });

  const club = clubQuery.data?.data;
  const categories = categoriesQuery.data?.data ?? [];
  const players = playersQuery.data?.data ?? [];
  const members = membersQuery.data?.data ?? [];
  const cuotas = cuotasQuery.data?.data ?? [];

  const paid = cuotas.filter((c: any) => c.status === 'PAID').length;
  const pending = cuotas.filter((c: any) => c.status === 'PENDING').length;
  const linkSent = cuotas.filter((c: any) => c.status === 'LINK_SENT').length;
  const overdue = cuotas.filter((c: any) => c.status === 'OVERDUE').length;
  const collected = cuotas
    .filter((c: any) => c.status === 'PAID')
    .reduce((acc: number, c: any) => acc + c.amount, 0);

  const statsLoading =
    clubQuery.isLoading ||
    categoriesQuery.isLoading ||
    playersQuery.isLoading ||
    membersQuery.isLoading ||
    cuotasQuery.isLoading;

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const activeCategories = categories.filter((c: any) => c.active).length;

  const statCards = [
    { label: 'Plantel', value: players.length, icon: Shirt, color: 'bg-brand-red', href: '/club/plantel' },
    { label: 'Categorías', value: categories.length, icon: Layers, color: 'bg-brand-blue', href: '/club/categorias' },
    { label: 'Socios', value: members.length, icon: Users, color: 'bg-brand-navy-mid', href: '/club/members' },
    { label: 'Cuotas cobradas', value: paid, icon: CheckCircle2, color: 'bg-emerald-600', href: '/club/cuotas' },
    { label: 'Pendientes', value: pending + linkSent, icon: Clock, color: 'bg-amber-500', href: '/club/cuotas' },
  ];

  const quickActions = [
    { label: 'Agregar jugador', href: '/club/plantel', icon: Shirt, color: 'text-brand-red' },
    { label: 'Nueva categoría', href: '/club/categorias', icon: Layers, color: 'text-brand-blue' },
    { label: 'Gestionar cuotas', href: '/club/cuotas', icon: Banknote, color: 'text-emerald-700' },
    { label: 'Ver socios', href: '/club/members', icon: Users, color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-8 max-w-7xl">

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg bg-brand-navy">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/90 to-brand-red/30" />
        <div className="relative z-10 px-8 py-8 flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm font-medium">
              {greeting}, {user?.fullName?.split(' ')[0]}
            </p>
            <h1 className="text-3xl font-extrabold text-white mt-1 tracking-tight">
              {club?.name ?? 'Mi Club'}
            </h1>
            <p className="text-white/60 text-sm mt-2">
              {MONTHS[month - 1]} {year} · {players.length} jugadores · {activeCategories} categoría{activeCategories !== 1 ? 's' : ''} activa{activeCategories !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex-shrink-0">
            <NextImage
              src="/logo.png"
              alt="Club logo"
              width={72}
              height={72}
              className="rounded-full shadow-2xl border-2 border-white/20"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statsLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))
          : statCards.map((s) => (
              <StatCard
                key={s.label}
                label={s.label}
                value={s.value}
                icon={s.icon}
                color={s.color}
                href={s.href}
              />
            ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-card hover:bg-accent transition-colors"
          >
            <a.icon size={16} className={a.color} />
            <span className={`text-sm font-medium ${a.color}`}>{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Categories summary — 3 cols */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-brand-red" />
                <h2 className="font-semibold">Categorías del club</h2>
                <Badge variant="secondary">{categories.length}</Badge>
              </div>
              <Link href="/club/categorias" className="text-xs text-muted-foreground hover:text-brand-red transition-colors flex items-center gap-1">
                Ver todas <ArrowRight size={12} />
              </Link>
            </div>

            {categoriesQuery.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center">
                <Layers size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">No hay categorías creadas</p>
                <Button asChild variant="link" className="mt-1 text-brand-red">
                  <Link href="/club/categorias" className="inline-flex items-center gap-1.5">
                    <Plus size={13} /> Crear categoría
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {categories.map((cat: any) => {
                  const catPlayers = players.filter((p: any) => p.clubCategoryId === cat.id);
                  const catCuotas = cuotas.filter((c: any) => c.player?.clubCategory?.id === cat.id);
                  const catPaid = catCuotas.filter((c: any) => c.status === 'PAID').length;
                  return (
                    <div key={cat.id} className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ActiveBadge active={cat.active} />
                        <div>
                          <p className="font-medium text-sm">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">{cat.coach ?? 'Sin profe asignado'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <p className="text-sm font-bold">{catPlayers.length}</p>
                          <p className="text-xs text-muted-foreground">jugadores</p>
                        </div>
                        {catCuotas.length > 0 && (
                          <div>
                            <p className="text-sm font-bold text-emerald-600">{catPaid}/{catCuotas.length}</p>
                            <p className="text-xs text-muted-foreground">cobradas</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right column — 2 cols */}
        <div className="lg:col-span-2 space-y-5">

          {/* Cuotas del mes */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-emerald-500" />
                <h2 className="font-semibold text-sm">Cuotas {MONTHS[month - 1]}</h2>
              </div>
              <Link href="/club/cuotas" className="text-xs text-muted-foreground hover:text-emerald-600 transition-colors">
                Ver todas →
              </Link>
            </div>
            <CardContent className="p-5 space-y-3">
              {cuotasQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  {[
                    { label: 'Cobradas', count: paid, dot: 'bg-emerald-500' },
                    { label: 'Link enviado', count: linkSent, dot: 'bg-blue-400' },
                    { label: 'Pendientes', count: pending, dot: 'bg-amber-400' },
                    { label: 'Vencidas', count: overdue, dot: 'bg-red-400' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${row.dot}`} />
                      <span className="text-sm text-muted-foreground flex-1">{row.label}</span>
                      <span className="text-sm font-bold">{row.count}</span>
                    </div>
                  ))}
                  {cuotas.length > 0 && (
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-muted-foreground">Total recaudado</span>
                        <span className="text-sm font-extrabold text-emerald-700">
                          ${collected.toLocaleString('es-AR')}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.round((paid / cuotas.length) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        {Math.round((paid / cuotas.length) * 100)}% cobrado
                      </p>
                    </div>
                  )}
                  {cuotas.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Sin cuotas generadas este mes
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Overdue alert */}
          {overdue > 0 && (
            <Link
              href="/club/cuotas"
              className="flex items-center gap-4 border border-destructive/20 bg-destructive/5 rounded-xl px-5 py-4 hover:bg-destructive/10 transition-colors"
            >
              <AlertTriangle size={20} className="text-destructive flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-destructive text-sm">
                  {overdue} cuota{overdue > 1 ? 's' : ''} vencida{overdue > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-destructive/80 mt-0.5">Hacé click para gestionar</p>
              </div>
              <ArrowRight size={14} className="text-destructive/60" />
            </Link>
          )}

          {/* Club info card */}
          {club && (club.address || club.phone || club.email || club.website) && (
            <Card className="overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-brand-navy" />
                  <h2 className="font-semibold text-sm">Info del club</h2>
                </div>
                <Link href="/club" className="text-xs text-muted-foreground hover:text-brand-red transition-colors">
                  Editar →
                </Link>
              </div>
              <CardContent className="p-5 space-y-2">
                {club.address && (
                  <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <Building2 size={14} className="text-muted-foreground/60 mt-0.5 flex-shrink-0" />
                    {club.address}
                  </p>
                )}
                {club.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="text-xs">📞</span> {club.phone}
                  </p>
                )}
                {club.email && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="text-xs">✉️</span> {club.email}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </div>

    </div>
  );
}
