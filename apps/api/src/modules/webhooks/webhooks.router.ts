import { Router } from 'express';
import { membersService } from '../members/members.service';

export const webhooksRouter = Router();

webhooksRouter.post('/mp', async (req, res) => {
  try {
    const result = await membersService.handleMpWebhook(req.body);
    res.json(result);
  } catch {
    res.status(200).json({ ignored: true });
  }
});
