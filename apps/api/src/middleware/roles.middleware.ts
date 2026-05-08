import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { AppError } from '../lib/app-error';

export function authorize(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new AppError('Autenticación requerida', 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Permisos insuficientes', 403));
    }
    next();
  };
}
