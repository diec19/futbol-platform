'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  Building2,
  Save,
  Globe,
  Phone,
  Mail,
  Instagram,
  Facebook,
  MessageCircle,
  CreditCard,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClubInfoPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['club'], queryFn: () => api.club.get() });
  const club = data?.data;

  const [form, setForm] = useState<Record<string, string>>({});
  const [showMpToken, setShowMpToken] = useState(false);
  const [showMpSecret, setShowMpSecret] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (d: unknown) => api.club.update(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club'] });
      toast.success('Cambios guardados');
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const val = (field: string) => (field in form ? form[field] : club?.[field] ?? '');
  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = () => {
    const payload: Record<string, any> = {};
    Object.keys(form).forEach((k) => {
      payload[k] = form[k] || undefined;
    });
    if (form.foundedYear) payload.foundedYear = parseInt(form.foundedYear);
    if (form.monthlyPlayerFee) payload.monthlyPlayerFee = parseFloat(form.monthlyPlayerFee);
    if (form.monthlyMemberFee) payload.monthlyMemberFee = parseFloat(form.monthlyMemberFee);
    updateMutation.mutate(payload);
  };

  const sectionTitle = (icon: React.ReactNode, title: string) => (
    <p className="flex items-center gap-2 text-sm font-semibold">
      {icon}
      {title}
    </p>
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="text-brand-red" size={24} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Info del Club</h1>
          <p className="text-sm text-muted-foreground">
            Datos generales, redes sociales y presentación pública
          </p>
        </div>
      </div>

      <Card className="divide-y">
        {/* Datos generales */}
        <CardContent className="space-y-4 pt-6">
          {sectionTitle(null, 'Datos generales')}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Nombre del club *</Label>
              <Input
                value={val('name')}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Club Atlético..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nombre corto</Label>
              <Input
                value={val('shortName')}
                onChange={(e) => set('shortName', e.target.value)}
                placeholder="CA..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Año de fundación</Label>
              <Input
                type="number"
                value={val('foundedYear')}
                onChange={(e) => set('foundedYear', e.target.value)}
                placeholder="1985"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Descripción / Historia</Label>
              <Textarea
                value={val('description')}
                onChange={(e) => set('description', e.target.value)}
                rows={4}
                placeholder="Historia del club..."
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Dirección</Label>
              <Input
                value={val('address')}
                onChange={(e) => set('address', e.target.value)}
                placeholder="Calle Falsa 123, Ciudad"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Logo (URL)</Label>
              <Input
                value={val('logo')}
                onChange={(e) => set('logo', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </CardContent>

        {/* Contacto */}
        <CardContent className="space-y-4 pt-6">
          {sectionTitle(null, 'Contacto')}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Phone size={11} />
                Teléfono
              </Label>
              <Input
                value={val('phone')}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+54 11 ..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Mail size={11} />
                Email
              </Label>
              <Input
                value={val('email')}
                onChange={(e) => set('email', e.target.value)}
                placeholder="club@..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Globe size={11} />
                Sitio web
              </Label>
              <Input
                value={val('website')}
                onChange={(e) => set('website', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <MessageCircle size={11} />
                WhatsApp
              </Label>
              <Input
                value={val('whatsapp')}
                onChange={(e) => set('whatsapp', e.target.value)}
                placeholder="+54 9 11 ..."
              />
            </div>
          </div>
        </CardContent>

        {/* Redes sociales */}
        <CardContent className="space-y-4 pt-6">
          {sectionTitle(null, 'Redes sociales')}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Instagram size={11} />
                Instagram
              </Label>
              <Input
                value={val('instagram')}
                onChange={(e) => set('instagram', e.target.value)}
                placeholder="@clubname"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Facebook size={11} />
                Facebook
              </Label>
              <Input
                value={val('facebook')}
                onChange={(e) => set('facebook', e.target.value)}
                placeholder="facebook.com/club"
              />
            </div>
          </div>
        </CardContent>

        {/* Mercado Pago */}
        <CardContent className="space-y-4 pt-6">
          {sectionTitle(<CreditCard size={14} />, 'Mercado Pago')}
          <p className="text-xs text-muted-foreground">
            Configuración de cobros con Mercado Pago. Cada cliente usa su propio Access Token.
          </p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Access Token</Label>
              <div className="flex gap-2">
                <Input
                  type={showMpToken ? 'text' : 'password'}
                  value={val('mpAccessToken')}
                  onChange={(e) => set('mpAccessToken', e.target.value)}
                  placeholder="APP_USR-..."
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 text-muted-foreground"
                  onClick={() => setShowMpToken(!showMpToken)}
                  aria-label={showMpToken ? 'Ocultar token de Mercado Pago' : 'Mostrar token de Mercado Pago'}
                >
                  {showMpToken ? <EyeOff size={15} /> : <Eye size={15} />}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Webhook Secret (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  type={showMpSecret ? 'text' : 'password'}
                  value={val('mpWebhookSecret')}
                  onChange={(e) => set('mpWebhookSecret', e.target.value)}
                  placeholder="Tu Webhook Secret"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 text-muted-foreground"
                  onClick={() => setShowMpSecret(!showMpSecret)}
                  aria-label={showMpSecret ? 'Ocultar webhook secret' : 'Mostrar webhook secret'}
                >
                  {showMpSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>

        {/* WhatsApp Business Cloud API */}
        <CardContent className="space-y-4 pt-6">
          {sectionTitle(<MessageCircle size={14} />, 'WhatsApp (Business Cloud API)')}
          <p className="text-xs text-muted-foreground">
            Envío automático de links de pago por WhatsApp. La conexión se configura con variables de entorno en el deploy:
            WHATSAPP_GRAPH_TOKEN y WHATSAPP_PHONE_NUMBER_ID.
          </p>
          <WhatsAppStatus />
        </CardContent>

        {/* Cuotas mensuales */}
        <CardContent className="space-y-4 pt-6">
          {sectionTitle(null, 'Cuotas mensuales')}
          <p className="text-xs text-muted-foreground">
            Montos que se usan para generar cuotas automáticamente el día 1 de cada mes.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Cuota mensual jugadores ($)</Label>
              <Input
                type="number"
                value={val('monthlyPlayerFee')}
                onChange={(e) => set('monthlyPlayerFee', e.target.value)}
                placeholder="15000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cuota mensual socios ($)</Label>
              <Input
                type="number"
                value={val('monthlyMemberFee')}
                onChange={(e) => set('monthlyMemberFee', e.target.value)}
                placeholder="10000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2">
          <Save size={15} />
          {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
}

function WhatsAppStatus() {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () => api.whatsapp.status(),
  });
  const connected = data?.data?.connected;

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
      <div className="flex-1 text-sm">
        {isLoading
          ? 'Verificando conexión...'
          : connected
            ? 'WhatsApp conectado'
            : 'WhatsApp no conectado'}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => refetch()}
        disabled={isFetching}
      >
        Verificar
      </Button>
    </div>
  );
}
