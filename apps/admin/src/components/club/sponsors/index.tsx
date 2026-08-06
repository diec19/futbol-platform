'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Plus, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SponsorModal } from './sponsor-modal';
import { PlanModal } from './plan-modal';
import { AuspicioModal } from './auspicio-modal';
import { SponsorItem } from './sponsor-item';

export default function SponsorsPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [editSponsor, setEditSponsor] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPlanFor, setShowPlanFor] = useState<any>(null);
  const [editPlan, setEditPlan] = useState<any>(null);
  const [showSponsorshipFor, setShowSponsorshipFor] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => api.sponsors.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.sponsors.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sponsors'] });
      toast.success('Estado actualizado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.sponsors.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sponsors'] });
      toast.success('Auspiciante eliminado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removePlanMutation = useMutation({
    mutationFn: (planId: string) => api.sponsors.plans.remove(planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sponsors'] });
      toast.success('Plan eliminado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const cancelSponsorshipMutation = useMutation({
    mutationFn: (id: string) => api.sponsorships.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sponsors'] });
      toast.success('Auspiciarion cancelado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const sponsors = data?.data ?? [];

  const { data: expandedData } = useQuery({
    queryKey: ['sponsor-detail', expandedId],
    queryFn: () => api.sponsors.get(expandedId!),
    enabled: !!expandedId,
  });
  const expandedSponsor = expandedData?.data;

  const onSponsorSaved = () => {
    setShowNew(false);
    setEditSponsor(null);
    qc.invalidateQueries({ queryKey: ['sponsors'] });
    toast.success('Auspiciante guardado');
  };

  return (
    <div className="space-y-6">
      {(showNew || editSponsor) && (
        <SponsorModal sponsor={editSponsor} onClose={() => { setShowNew(false); setEditSponsor(null); }} onSaved={onSponsorSaved} />
      )}
      {showPlanFor && (
        <PlanModal
          sponsor={showPlanFor}
          onClose={() => setShowPlanFor(null)}
          onSaved={() => {
            setShowPlanFor(null);
            qc.invalidateQueries({ queryKey: ['sponsors'] });
            toast.success('Plan guardado');
          }}
        />
      )}
      {editPlan && (
        <PlanModal
          plan={editPlan}
          onClose={() => setEditPlan(null)}
          onSaved={() => {
            setEditPlan(null);
            qc.invalidateQueries({ queryKey: ['sponsors'] });
            toast.success('Plan actualizado');
          }}
        />
      )}
      {showSponsorshipFor && (
        <AuspicioModal
          sponsor={showSponsorshipFor.sponsor}
          plans={showSponsorshipFor.plans}
          onClose={() => setShowSponsorshipFor(null)}
          onSaved={() => {
            setShowSponsorshipFor(null);
            qc.invalidateQueries({ queryKey: ['sponsors'] });
            toast.success('Auspiciarion creado');
          }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Auspiciantes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sponsors.length} auspiciantes registrados
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowNew(true)}>
          <Plus size={15} /> Nuevo auspiciante
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : sponsors.length === 0 ? (
        <div className="space-y-3 p-12 text-center">
          <Handshake size={40} className="mx-auto text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">No hay auspiciantes registrados</p>
          <p className="text-sm text-muted-foreground/70">
            Agregá auspiciantes para gestionar sus planes y cuotas
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sponsors.map((sponsor: any) => {
            const isExpanded = expandedId === sponsor.id;
            const plans = expandedSponsor?.plans ?? sponsor.plans ?? [];
            const sponsorships = expandedSponsor?.sponsorships ?? [];
            return (
              <SponsorItem
                key={sponsor.id}
                sponsor={sponsor}
                isExpanded={isExpanded}
                plans={plans}
                sponsorships={sponsorships}
                onToggle={() => setExpandedId(isExpanded ? null : sponsor.id)}
                onEdit={() => setEditSponsor(sponsor)}
                onToggleActive={() => toggleMutation.mutate(sponsor.id)}
                onRemove={() => removeMutation.mutate(sponsor.id)}
                onAddPlan={() => setShowPlanFor(sponsor)}
                onEditPlan={setEditPlan}
                onRemovePlan={(plan) => removePlanMutation.mutate(plan.id)}
                onNewSponsorship={() => setShowSponsorshipFor({ sponsor, plans })}
                onCancelSponsorship={(sub) => cancelSponsorshipMutation.mutate(sub.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
