import { Request, Response, NextFunction } from 'express';
import { clubService } from './club.service';

export const clubController = {
  // ── Info ─────────────────────────────────────────────────────────────────
  getClub: async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await clubService.get() }); } catch (e) { next(e); }
  },
  updateClub: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await clubService.update(req.body) }); } catch (e) { next(e); }
  },

  // ── News ──────────────────────────────────────────────────────────────────
  listNews: async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await clubService.listNews() }); } catch (e) { next(e); }
  },
  createNews: async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ data: await clubService.createNews(req.body) }); } catch (e) { next(e); }
  },
  updateNews: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await clubService.updateNews(req.params.id, req.body) }); } catch (e) { next(e); }
  },
  deleteNews: async (req: Request, res: Response, next: NextFunction) => {
    try { await clubService.deleteNews(req.params.id); res.status(204).send(); } catch (e) { next(e); }
  },

  // ── Staff ─────────────────────────────────────────────────────────────────
  listStaff: async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await clubService.listStaff() }); } catch (e) { next(e); }
  },
  createStaff: async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ data: await clubService.createStaff(req.body) }); } catch (e) { next(e); }
  },
  updateStaff: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await clubService.updateStaff(req.params.id, req.body) }); } catch (e) { next(e); }
  },
  deleteStaff: async (req: Request, res: Response, next: NextFunction) => {
    try { await clubService.deleteStaff(req.params.id); res.status(204).send(); } catch (e) { next(e); }
  },

  // ── Gallery ───────────────────────────────────────────────────────────────
  listGallery: async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await clubService.listGallery() }); } catch (e) { next(e); }
  },
  addPhoto: async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ data: await clubService.addPhoto(req.body) }); } catch (e) { next(e); }
  },
  removePhoto: async (req: Request, res: Response, next: NextFunction) => {
    try { await clubService.removePhoto(req.params.id); res.status(204).send(); } catch (e) { next(e); }
  },

  // ── Fields ────────────────────────────────────────────────────────────────
  listFields: async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await clubService.listFields() }); } catch (e) { next(e); }
  },
  createField: async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ data: await clubService.createField(req.body) }); } catch (e) { next(e); }
  },
  updateField: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await clubService.updateField(req.params.id, req.body) }); } catch (e) { next(e); }
  },
  deleteField: async (req: Request, res: Response, next: NextFunction) => {
    try { await clubService.deleteField(req.params.id); res.status(204).send(); } catch (e) { next(e); }
  },

  // ── Credentials ───────────────────────────────────────────────────────────
  generateCredential: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await clubService.generateCredential(req.params.playerId) }); } catch (e) { next(e); }
  },
  getCredential: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await clubService.getCredential(req.params.playerId) }); } catch (e) { next(e); }
  },

  // ── Club Categories ───────────────────────────────────────────────────────
  listClubCategories: async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await clubService.listClubCategories() }); } catch (e) { next(e); }
  },
  createClubCategory: async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ data: await clubService.createClubCategory(req.body) }); } catch (e) { next(e); }
  },
  updateClubCategory: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await clubService.updateClubCategory(req.params.id, req.body) }); } catch (e) { next(e); }
  },
  deleteClubCategory: async (req: Request, res: Response, next: NextFunction) => {
    try { await clubService.deleteClubCategory(req.params.id); res.status(204).send(); } catch (e) { next(e); }
  },

  // ── Payments ──────────────────────────────────────────────────────────────
  listPayments: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await clubService.listPayments(req.query.teamId as string) }); } catch (e) { next(e); }
  },
  createPayment: async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ data: await clubService.createPayment(req.body) }); } catch (e) { next(e); }
  },
  markPaid: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await clubService.markPaymentPaid(req.params.id) }); } catch (e) { next(e); }
  },
  deletePayment: async (req: Request, res: Response, next: NextFunction) => {
    try { await clubService.deletePayment(req.params.id); res.status(204).send(); } catch (e) { next(e); }
  },
};
