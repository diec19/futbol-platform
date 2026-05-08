import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthRequest } from '../../middleware/auth.middleware';

const service = new AuthService();

export class AuthController {
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.login(req.body.login, req.body.password);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const result = await service.refresh(refreshToken);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  };

  me = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await service.me(req.user!.id);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await service.createUser(req.body);
      res.status(201).json({ data: user });
    } catch (err) {
      next(err);
    }
  };

  listUsers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await service.listUsers();
      res.json({ data: users });
    } catch (err) {
      next(err);
    }
  };
}
