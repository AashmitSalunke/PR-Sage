import { Router } from 'express';
import { body } from 'express-validator';
import authMiddleware from '../middleware/auth.middleware.js';
import {
  startReview,
  getReview,
  postCommentsToGitHub,
} from '../controllers/review.controller.js';

const router = Router();

// All review routes require auth
router.use(authMiddleware);

// POST /api/reviews — start a new review (SSE stream)
router.post(
  '/',
  [body('prUrl').trim().notEmpty().withMessage('PR URL is required')],
  startReview
);

// GET /api/reviews/:id — get a single review
router.get('/:id', getReview);

// POST /api/reviews/:id/post-comments — post comments to GitHub
router.post('/:id/post-comments', postCommentsToGitHub);

export default router;
