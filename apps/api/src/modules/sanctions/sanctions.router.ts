import { Router } from 'express';
import { SanctionsController } from './sanctions.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createSanctionSchema } from '@futbol/validations';

const router = Router();
const ctrl = new SanctionsController();

router.get('/', ctrl.findAll);
router.get('/:id', ctrl.findById);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), validate(createSanctionSchema), ctrl.create);
router.patch('/:id/resolve', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), ctrl.resolve);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), ctrl.remove);

export { router as sanctionsRouter };
