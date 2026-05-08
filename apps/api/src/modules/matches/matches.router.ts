import { Router } from 'express';
import { MatchesController } from './matches.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';
import { validate } from '../../middleware/validate.middleware';
import { scheduleMatchSchema, loadResultSchema, generateFixtureSchema } from '@futbol/validations';

const router = Router();
const ctrl = new MatchesController();

router.get('/', ctrl.findAll);
router.get('/:id', ctrl.findById);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), validate(scheduleMatchSchema), ctrl.create);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), ctrl.update);
router.patch('/:id/result', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), validate(loadResultSchema), ctrl.loadResult);
router.patch('/:id/postpone', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), ctrl.postpone);
router.post('/fixture/generate', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(generateFixtureSchema), ctrl.generateFixture);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), ctrl.remove);

export { router as matchesRouter };
