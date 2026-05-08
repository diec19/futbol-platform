import { Router } from 'express';
import { BracketsController } from './brackets.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';
import { validate } from '../../middleware/validate.middleware';
import { initBracketSchema } from '@futbol/validations';

const router = Router();
const ctrl = new BracketsController();

router.get('/category/:categoryId', ctrl.getByCategory);
router.post('/init', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(initBracketSchema), ctrl.initialize);

export { router as bracketsRouter };
