import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';
import { validate } from '../../middleware/validate.middleware';
import { loginSchema, createUserSchema } from '@futbol/validations';

const router = Router();
const ctrl = new AuthController();

router.post('/login', validate(loginSchema), ctrl.login);
router.post('/refresh', ctrl.refresh);
router.get('/me', authenticate, ctrl.me);
router.post('/users', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validate(createUserSchema), ctrl.createUser);
router.get('/users', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), ctrl.listUsers);

export { router as authRouter };
