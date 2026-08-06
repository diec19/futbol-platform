import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Página no encontrada</CardTitle>
          <CardDescription>La página que buscás no existe o fue movida.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href="/">Volver al dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
