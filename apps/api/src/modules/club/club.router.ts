import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { clubController as ctrl } from './club.controller';

export const clubRouter = Router();

clubRouter.use(authenticate);

// Info
clubRouter.get('/', ctrl.getClub);
clubRouter.put('/', ctrl.updateClub);

// News
clubRouter.get('/news', ctrl.listNews);
clubRouter.post('/news', ctrl.createNews);
clubRouter.put('/news/:id', ctrl.updateNews);
clubRouter.delete('/news/:id', ctrl.deleteNews);

// Staff
clubRouter.get('/staff', ctrl.listStaff);
clubRouter.post('/staff', ctrl.createStaff);
clubRouter.put('/staff/:id', ctrl.updateStaff);
clubRouter.delete('/staff/:id', ctrl.deleteStaff);

// Gallery
clubRouter.get('/gallery', ctrl.listGallery);
clubRouter.post('/gallery', ctrl.addPhoto);
clubRouter.delete('/gallery/:id', ctrl.removePhoto);

// Fields
clubRouter.get('/fields', ctrl.listFields);
clubRouter.post('/fields', ctrl.createField);
clubRouter.put('/fields/:id', ctrl.updateField);
clubRouter.delete('/fields/:id', ctrl.deleteField);

// Player credentials (public read for QR scan, protected write)
clubRouter.post('/credentials/:playerId', ctrl.generateCredential);
clubRouter.get('/credentials/:playerId', ctrl.getCredential);

// Club Categories
clubRouter.get('/categories', ctrl.listClubCategories);
clubRouter.post('/categories', ctrl.createClubCategory);
clubRouter.put('/categories/:id', ctrl.updateClubCategory);
clubRouter.delete('/categories/:id', ctrl.deleteClubCategory);

// Finance (unified payments + subscriptions)
clubRouter.get('/finance/all', ctrl.listAllFinance);

// Payments
clubRouter.get('/payments', ctrl.listPayments);
clubRouter.post('/payments', ctrl.createPayment);
clubRouter.patch('/payments/:id/pay', ctrl.markPaid);
clubRouter.delete('/payments/:id', ctrl.deletePayment);
