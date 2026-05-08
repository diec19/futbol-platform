import { Request, Response, NextFunction } from 'express';
import { RefereesService } from './referees.service';

const service = new RefereesService();

export class RefereesController {
  findAll = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await service.findAll(req.query)); } catch (err) { next(err); }
  };
  findById = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await service.findById(req.params.id) }); } catch (err) { next(err); }
  };
  create = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ data: await service.create(req.body) }); } catch (err) { next(err); }
  };
  update = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await service.update(req.params.id, req.body) }); } catch (err) { next(err); }
  };
  toggle = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await service.toggle(req.params.id) }); } catch (err) { next(err); }
  };
  remove = async (req: Request, res: Response, next: NextFunction) => {
    try { await service.remove(req.params.id); res.status(204).send(); } catch (err) { next(err); }
  };
}
