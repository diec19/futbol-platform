import { Request, Response, NextFunction } from 'express';
import { TournamentsService } from './tournaments.service';

const service = new TournamentsService();

export class TournamentsController {
  findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.findAll(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await service.findById(req.params.id);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await service.getStats(req.params.id);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await service.create(req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await service.update(req.params.id, req.body);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await service.updateStatus(req.params.id, req.body.status);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await service.remove(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
