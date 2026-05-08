import { Router } from 'express';
import { TournamentsController } from './tournaments.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createTournamentSchema, updateTournamentSchema } from '@futbol/validations';

const router = Router();
const ctrl = new TournamentsController();

router.get('/', ctrl.findAll);
router.get('/:id', ctrl.findById);
router.get('/:id/stats', ctrl.getStats);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(createTournamentSchema), ctrl.create);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(updateTournamentSchema), ctrl.update);
router.patch('/:id/status', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), ctrl.updateStatus);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), ctrl.remove);

export { router as tournamentsRouter };
