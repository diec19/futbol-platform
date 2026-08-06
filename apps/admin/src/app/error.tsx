'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <TriangleAlert className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Algo salió mal</CardTitle>
          <CardDescription>Ocurrió un error inesperado. Podés reintentar o volver a cargar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => {
              reset();
              router.refresh();
            }}
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
