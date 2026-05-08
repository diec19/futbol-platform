import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/app-error';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, errors: err.errors });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation error', errors: err.flatten().fieldErrors });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe un registro con esos datos', field: err.meta?.target });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Registro no encontrado' });
      return;
    }
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
