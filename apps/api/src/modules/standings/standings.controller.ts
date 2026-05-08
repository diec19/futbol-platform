import { Request, Response, NextFunction } from 'express';
import { StandingsService } from './standings.service';

const service = new StandingsService();

export class StandingsController {
  getByGroup = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await service.getByGroup(req.params.groupId) }); } catch (err) { next(err); }
  };
  getByCategory = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await service.getByCategory(req.params.categoryId) }); } catch (err) { next(err); }
  };
  recalculate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await service.recalculate(req.params.groupId);
      res.json({ message: 'Posiciones recalculadas' });
    } catch (err) { next(err); }
  };
  createGroup = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ data: await service.createGroup(req.body) }); } catch (err) { next(err); }
  };
  addTeamsToGroup = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await service.addTeamsToGroup(req.params.groupId, req.body.teamIds) }); } catch (err) { next(err); }
  };
}
