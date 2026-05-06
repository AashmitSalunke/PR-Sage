import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { getHistory, deleteReview } from '../controllers/history.controller.js';

const router = Router();

router.use(authMiddleware);

// GET /api/history?page=1&limit=10
router.get('/', getHistory);

// DELETE /api/history/:id
router.delete('/:id', deleteReview);

export default router;
