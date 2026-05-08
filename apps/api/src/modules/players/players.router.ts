import { Router } from 'express';
import { PlayersController } from './players.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createPlayerSchema, updatePlayerSchema } from '@futbol/validations';

const router = Router();
const ctrl = new PlayersController();

router.get('/', ctrl.findAll);
router.get('/:id', ctrl.findById);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR', 'DELEGATE'), validate(createPlayerSchema), ctrl.create);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR', 'DELEGATE'), validate(updatePlayerSchema), ctrl.update);
router.patch('/:id/toggle', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), ctrl.toggle);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), ctrl.remove);

export { router as playersRouter };
