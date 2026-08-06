import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { clubController as ctrl } from './club.controller';

export const clubRouter = Router();

// Info
clubRouter.get('/', authenticate, ctrl.getClub);
clubRouter.put('/', authenticate, ctrl.updateClub);

// News
clubRouter.get('/news', ctrl.listNews);
clubRouter.post('/news', authenticate, ctrl.createNews);
clubRouter.put('/news/:id', authenticate, ctrl.updateNews);
clubRouter.delete('/news/:id', authenticate, ctrl.deleteNews);

// Staff
clubRouter.get('/staff', authenticate, ctrl.listStaff);
clubRouter.post('/staff', authenticate, ctrl.createStaff);
clubRouter.put('/staff/:id', authenticate, ctrl.updateStaff);
clubRouter.delete('/staff/:id', authenticate, ctrl.deleteStaff);

// Gallery
clubRouter.get('/gallery', authenticate, ctrl.listGallery);
clubRouter.post('/gallery', authenticate, ctrl.addPhoto);
clubRouter.delete('/gallery/:id', authenticate, ctrl.removePhoto);

// Fields
clubRouter.get('/fields', authenticate, ctrl.listFields);
clubRouter.post('/fields', authenticate, ctrl.createField);
clubRouter.put('/fields/:id', authenticate, ctrl.updateField);
clubRouter.delete('/fields/:id', authenticate, ctrl.deleteField);

// Player credentials (protected)
clubRouter.post('/credentials/:playerId', authenticate, ctrl.generateCredential);
clubRouter.get('/credentials/:playerId', authenticate, ctrl.getCredential);

// Club Categories
clubRouter.get('/categories', authenticate, ctrl.listClubCategories);
clubRouter.post('/categories', authenticate, ctrl.createClubCategory);
clubRouter.put('/categories/:id', authenticate, ctrl.updateClubCategory);
clubRouter.delete('/categories/:id', authenticate, ctrl.deleteClubCategory);

// Finance (unified payments + subscriptions)
clubRouter.get('/finance/all', authenticate, ctrl.listAllFinance);

// Payments
clubRouter.get('/payments', authenticate, ctrl.listPayments);
clubRouter.post('/payments', authenticate, ctrl.createPayment);
clubRouter.patch('/payments/:id/pay', authenticate, ctrl.markPaid);
clubRouter.delete('/payments/:id', authenticate, ctrl.deletePayment);
