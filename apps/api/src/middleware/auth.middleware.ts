import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../lib/app-error';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; email: string };
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('Autenticación requerida', 401));
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      role: string;
      email: string;
      type: string;
    };
    if (payload.type !== 'admin') return next(new AppError('Token inválido o expirado', 401));
    req.user = payload;
    next();
  } catch {
    next(new AppError('Token inválido o expirado', 401));
  }
}
