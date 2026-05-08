import { Request, Response, NextFunction } from 'express';
import { BracketsService } from './brackets.service';

const service = new BracketsService();

export class BracketsController {
  getByCategory = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await service.getByCategory(req.params.categoryId) }); } catch (err) { next(err); }
  };
  initialize = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ data: await service.initialize(req.body) }); } catch (err) { next(err); }
  };
}
