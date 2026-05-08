import { Router } from 'express';
import { CategoriesController } from './categories.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createCategorySchema, updateCategorySchema } from '@futbol/validations';

const router = Router();
const ctrl = new CategoriesController();

router.get('/', ctrl.findAll);
router.get('/:id', ctrl.findById);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), validate(createCategorySchema), ctrl.create);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), validate(updateCategorySchema), ctrl.update);
router.patch('/:id/toggle', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), ctrl.toggle);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), ctrl.remove);

export { router as categoriesRouter };
