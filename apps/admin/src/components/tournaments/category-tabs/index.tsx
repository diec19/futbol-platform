'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ActiveBadge } from '@/components/domain/status-badge';
import { TeamsTab } from './teams-tab';
import { GroupsTab } from './groups-tab';
import { MatchesTab } from './matches-tab';
import { BracketsTab } from './brackets-tab';
import { StatsTab } from './stats-tab';

type TabId = 'equipos' | 'grupos' | 'partidos' | 'llaves' | 'estadisticas';

const TABS: { id: TabId; label: string }[] = [
  { id: 'equipos', label: 'Equipos' },
  { id: 'grupos', label: 'Grupos y Posiciones' },
  { id: 'partidos', label: 'Partidos' },
  { id: 'llaves', label: 'Llaves' },
  { id: 'estadisticas', label: 'Estadísticas' },
];

export function CategoryTabs({
  tournamentId,
  categoryId,
}: {
  tournamentId: string;
  categoryId: string;
}) {
  const [activeTab, setActiveTab] = useState<TabId>('equipos');

  const { data } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => api.categories.get(categoryId),
  });

  const category = data?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/tournaments/${tournamentId}`}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{category?.name ?? 'Categoría'}</h1>
            {category && <ActiveBadge active={category.active} />}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {category?.tournament?.name} · {category?.phaseType === 'MIXED' ? 'Grupos + Eliminación' : category?.phaseType}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
        <TabsList>
          {TABS.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="equipos">
          <TeamsTab categoryId={categoryId} />
        </TabsContent>
        <TabsContent value="grupos">
          <GroupsTab categoryId={categoryId} />
        </TabsContent>
        <TabsContent value="partidos">
          <MatchesTab categoryId={categoryId} />
        </TabsContent>
        <TabsContent value="llaves">
          <BracketsTab categoryId={categoryId} />
        </TabsContent>
        <TabsContent value="estadisticas">
          <StatsTab categoryId={categoryId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
