import { Request, Response, NextFunction } from 'express';
import { StatisticsService } from './statistics.service';

const service = new StatisticsService();

export class StatisticsController {
  globalStats = async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await service.globalStats() }); } catch (err) { next(err); }
  };
  tournamentSummary = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await service.tournamentSummary(req.params.tournamentId) }); } catch (err) { next(err); }
  };
  topScorers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      res.json({ data: await service.topScorers(req.params.categoryId, limit) });
    } catch (err) { next(err); }
  };
  cardStats = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await service.cardStats(req.params.categoryId) }); } catch (err) { next(err); }
  };
  goalkeepers = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await service.goalkeepers(req.params.categoryId) }); } catch (err) { next(err); }
  };
  fairPlay = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await service.fairPlay(req.params.categoryId) }); } catch (err) { next(err); }
  };
}
