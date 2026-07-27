import { Router, Request, Response, NextFunction } from 'express';
import { benefitsService } from './benefits.service';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';

const router = Router();

// ── Public (mobile) ──────────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await benefitsService.listActive();
    res.json({ data });
  } catch (e) { next(e); }
});

// ── Admin ────────────────────────────────────────────────────────────────────
router.get('/admin', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await benefitsService.listAll();
    res.json({ data });
  } catch (e) { next(e); }
});

router.get('/admin/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await benefitsService.get(req.params.id);
    res.json({ data });
  } catch (e) { next(e); }
});

router.post('/admin', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await benefitsService.create(req.body);
    res.status(201).json({ data });
  } catch (e) { next(e); }
});

router.put('/admin/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await benefitsService.update(req.params.id, req.body);
    res.json({ data });
  } catch (e) { next(e); }
});

router.delete('/admin/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await benefitsService.remove(req.params.id);
    res.json({ data: { deleted: true } });
  } catch (e) { next(e); }
});

router.patch('/admin/:id/toggle', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await benefitsService.toggle(req.params.id);
    res.json({ data });
  } catch (e) { next(e); }
});

export { router as benefitsRouter };
