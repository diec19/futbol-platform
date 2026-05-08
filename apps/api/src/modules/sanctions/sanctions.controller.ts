import { Request, Response, NextFunction } from 'express';
import { SanctionsService } from './sanctions.service';

const service = new SanctionsService();

export class SanctionsController {
  findAll = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await service.findAll(req.query)); } catch (err) { next(err); }
  };
  findById = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await service.findById(req.params.id) }); } catch (err) { next(err); }
  };
  create = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ data: await service.create(req.body) }); } catch (err) { next(err); }
  };
  resolve = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await service.resolve(req.params.id) }); } catch (err) { next(err); }
  };
  remove = async (req: Request, res: Response, next: NextFunction) => {
    try { await service.remove(req.params.id); res.status(204).send(); } catch (err) { next(err); }
  };
}
