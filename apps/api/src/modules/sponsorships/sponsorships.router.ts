import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createSponsorshipSchema } from '@futbol/validations';
import { sponsorshipsService as svc } from './sponsorships.service';

const router = Router();

const wrap = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

// ── Sponsorship CRUD ────────────────────────────────────────────────────────
router.get('/', authenticate, wrap(async (req, res) => {
  const { sponsorId, status } = req.query as Record<string, string>;
  const data = await svc.list({ sponsorId, status });
  res.json({ data });
}));

router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(createSponsorshipSchema), wrap(async (req, res) => {
  const data = await svc.create(req.body);
  res.status(201).json({ data });
}));

router.patch('/:id/cancel', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), wrap(async (req, res) => {
  const data = await svc.cancel(req.params.id);
  res.json({ data });
}));

// ── Sponsor Payments (cuotas) ───────────────────────────────────────────────
router.get('/payments', authenticate, wrap(async (req, res) => {
  const { sponsorId, status, month, year } = req.query as Record<string, string>;
  const data = await svc.listPayments({
    sponsorId,
    status,
    month: month ? Number(month) : undefined,
    year: year ? Number(year) : undefined,
  });
  res.json({ data });
}));

router.post('/:sponsorshipId/payments', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), wrap(async (req, res) => {
  const data = await svc.generatePayments(req.params.sponsorshipId, req.body);
  res.status(201).json({ data });
}));

router.post('/payments/bulk', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), wrap(async (req, res) => {
  const data = await svc.generateBulkPayments(req.body);
  res.json({ data });
}));

router.patch('/payments/:paymentId/pay', authenticate, wrap(async (req, res) => {
  const data = await svc.markPaid(req.params.paymentId);
  res.json({ data });
}));

router.delete('/payments/:paymentId', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), wrap(async (req, res) => {
  await svc.removePayment(req.params.paymentId);
  res.status(204).send();
}));

export { router as sponsorshipsRouter };
