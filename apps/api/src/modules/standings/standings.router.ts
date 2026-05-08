import { Router } from 'express';
import { StandingsController } from './standings.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';

const router = Router();
const ctrl = new StandingsController();

router.get('/group/:groupId', ctrl.getByGroup);
router.get('/category/:categoryId', ctrl.getByCategory);
router.post('/group/:groupId/recalculate', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), ctrl.recalculate);
router.post('/group', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), ctrl.createGroup);
router.post('/group/:groupId/teams', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), ctrl.addTeamsToGroup);

export { router as standingsRouter };
