import { Request, Response, NextFunction } from 'express';
import { membersService as svc } from './members.service';

export const membersController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await svc.login(req.body.username, req.body.password) }); } catch (e) { next(e); }
  },
  me: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await svc.me((req as any).memberId) }); } catch (e) { next(e); }
  },
  list: async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await svc.list() }); } catch (e) { next(e); }
  },
  get: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await svc.get(req.params.id) }); } catch (e) { next(e); }
  },
  create: async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ data: await svc.create(req.body) }); } catch (e) { next(e); }
  },
  update: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await svc.update(req.params.id, req.body) }); } catch (e) { next(e); }
  },
  remove: async (req: Request, res: Response, next: NextFunction) => {
    try { await svc.remove(req.params.id); res.status(204).send(); } catch (e) { next(e); }
  },
  linkPlayer: async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ data: await svc.linkPlayer(req.params.id, req.body.playerId) }); } catch (e) { next(e); }
  },
  linkPlayerByDni: async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ data: await svc.linkPlayerByDni((req as any).memberId, req.body) }); } catch (e) { next(e); }
  },
  createJoinRequest: async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ data: await svc.createJoinRequest((req as any).memberId, req.body) }); } catch (e) { next(e); }
  },
  createUnlinkRequest: async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ data: await svc.createUnlinkRequest((req as any).memberId, req.body) }); } catch (e) { next(e); }
  },
  listUnlinkRequests: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query;
      res.json({ data: await svc.listUnlinkRequests(status as string | undefined) });
    } catch (e) { next(e); }
  },
  approveUnlinkRequest: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await svc.approveUnlinkRequest(req.params.id, req.body.setActive) }); } catch (e) { next(e); }
  },
  rejectUnlinkRequest: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await svc.rejectUnlinkRequest(req.params.id, req.body.adminNote) }); } catch (e) { next(e); }
  },
  listJoinRequests: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query;
      res.json({ data: await svc.listJoinRequests(status as string | undefined) });
    } catch (e) { next(e); }
  },
  approveJoinRequest: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await svc.approveJoinRequest(req.params.id) }); } catch (e) { next(e); }
  },
  rejectJoinRequest: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await svc.rejectJoinRequest(req.params.id, req.body.adminNote) }); } catch (e) { next(e); }
  },
  unlinkPlayer: async (req: Request, res: Response, next: NextFunction) => {
    try { await svc.unlinkPlayer(req.params.id, req.params.playerId); res.status(204).send(); } catch (e) { next(e); }
  },
  listAllSubscriptions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, month, year } = req.query;
      res.json({ data: await svc.listAllSubscriptions({
        status: status as string | undefined,
        month: month ? Number(month) : undefined,
        year: year ? Number(year) : undefined,
      }) });
    } catch (e) { next(e); }
  },
  listSubscriptions: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await svc.listSubscriptions(req.params.id) }); } catch (e) { next(e); }
  },
  createSubscription: async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ data: await svc.createSubscription(req.params.id, req.body) }); } catch (e) { next(e); }
  },
  createBulk: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { month, year, amount, dueDate, childAmount, sendWhatsapp } = req.body;
      res.json({ data: await svc.createBulkSubscriptions(month, year, amount, dueDate, childAmount, sendWhatsapp) });
    } catch (e) { next(e); }
  },
  sendLink: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await svc.sendPaymentLink(req.params.subId, req.body.amount) }); } catch (e) { next(e); }
  },
  markPaid: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await svc.markPaid(req.params.subId) }); } catch (e) { next(e); }
  },
  markOverdue: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await svc.markOverdue(req.params.subId) }); } catch (e) { next(e); }
  },
  deleteSubscription: async (req: Request, res: Response, next: NextFunction) => {
    try { await svc.deleteSubscription(req.params.subId); res.status(204).send(); } catch (e) { next(e); }
  },
};
