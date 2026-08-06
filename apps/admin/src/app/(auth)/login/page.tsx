'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { saveTokens } from '@/lib/auth';
import { loginFormSchema, type LoginFormValues } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { login: '', password: '' },
  });
  const [serverError, setServerError] = useState('');

  const onSubmit = async (values: LoginFormValues) => {
    setServerError('');
    try {
      const res = await api.auth.login(values.login, values.password);
      saveTokens(res.data.accessToken, res.data.refreshToken, res.data.user);
      router.push('/');
    } catch (err: any) {
      setServerError(err.message ?? 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo + nombre */}
        <div className="text-center mb-8 space-y-3">
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="Club logo"
              width={96}
              height={96}
              className="rounded-full shadow-2xl ring-4 ring-white/10"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Club DM</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Panel Administrativo</p>
          </div>
        </div>

        <div className="dark">
          <Card>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="login">Usuario o Email</Label>
                  <Input
                    id="login"
                    type="text"
                    placeholder="admin"
                    autoComplete="username"
                    {...register('login')}
                    aria-invalid={!!errors.login}
                  />
                  {errors.login && <p className="text-sm text-destructive">{errors.login.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register('password')}
                    aria-invalid={!!errors.password}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                {serverError && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {serverError}
                  </p>
                )}

                <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
                  {isSubmitting ? 'Ingresando...' : 'Ingresar'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
