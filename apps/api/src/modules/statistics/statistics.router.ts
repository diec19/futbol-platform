import { Router } from 'express';
import { StatisticsController } from './statistics.controller';

const router = Router();
const ctrl = new StatisticsController();

router.get('/global', ctrl.globalStats);
router.get('/tournament/:tournamentId/summary', ctrl.tournamentSummary);
router.get('/category/:categoryId/scorers', ctrl.topScorers);
router.get('/category/:categoryId/cards', ctrl.cardStats);
router.get('/category/:categoryId/goalkeepers', ctrl.goalkeepers);
router.get('/category/:categoryId/fairplay', ctrl.fairPlay);

export { router as statisticsRouter };
