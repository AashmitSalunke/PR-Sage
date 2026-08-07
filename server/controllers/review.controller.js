import { validationResult } from 'express-validator';
import Review from '../models/Review.js';
import Settings from '../models/Settings.js';
import { getPRDiff, parsePRUrl, postReviewComments } from '../services/github.service.js';
import { parseDiffString, chunkDiff } from '../services/diff.service.js';
import { buildReviewPrompt } from '../services/prompt.service.js';
import { streamReview } from '../services/gemini.service.js';

/**
 * POST /api/reviews
 * Starts a PR review. Uses SSE to stream progress to the client.
 */
export const startReview = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { prUrl } = req.body;

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  let review;
  try {
    // Parse PR URL
    const { owner, repo, prNumber } = parsePRUrl(prUrl);

    // Load user settings
    const settings = await Settings.findOne({ userId: req.user._id });
    if (!settings || !settings.githubToken) {
      send('error', { message: 'GitHub token not configured. Go to Settings.' });
      return res.end();
    }

    // Do not use legacy per-user provider settings; Nemotron model selection is
    // configured centrally in the server environment.
    const model = process.env.NEMOTRON_MODEL || 'nvidia/llama-3.1-nemotron-ultra-253b-v1';
    const nemotronApiKey = process.env.NEMOTRON_API_KEY;
    if (!nemotronApiKey) {
      send('error', { message: 'NEMOTRON_API_KEY not set in server environment.' });
      return res.end();
    }

    // Create review record
    review = await Review.create({
      userId: req.user._id,
      prUrl,
      owner,
      repo,
      prNumber,
      status: 'pending',
      model,
    });

    send('started', { reviewId: review._id, message: 'Fetching PR diff from GitHub...' });

    // Fetch diff
    const { diff, pr } = await getPRDiff(owner, repo, prNumber, settings.githubToken);
    review.rawDiff = diff;
    review.prTitle = pr.title;
    review.prDescription = pr.body;
    review.status = 'streaming';
    await review.save();

    send('pr_info', {
      title: pr.title,
      description: pr.body,
      additions: pr.additions,
      deletions: pr.deletions,
    });

    // Parse & chunk diff
    const files = parseDiffString(diff);
    const chunks = chunkDiff(files);

    send('chunks', { total: chunks.length });

    const allComments = [];

    for (let i = 0; i < chunks.length; i++) {
      send('chunk_start', { index: i, total: chunks.length });

      const prompt = buildReviewPrompt(pr.title, pr.body, chunks[i], i, chunks.length);

      let fullResponse = '';
      for await (const token of streamReview(prompt, model, nemotronApiKey)) {
        fullResponse += token;
        send('token', { chunk: i, token });
      }

      // Parse LLM JSON response
      try {
        const parsed = JSON.parse(fullResponse);
        if (parsed.comments) {
          allComments.push(...parsed.comments);
          send('chunk_done', { index: i, comments: parsed.comments, summary: parsed.summary });
        }
      } catch {
        // If LLM didn't return valid JSON, store the raw text as a single comment
        allComments.push({ path: 'GENERAL', line: null, side: 'RIGHT', body: fullResponse });
        send('chunk_done', { index: i, comments: [], summary: fullResponse });
      }
    }

    // Save all comments to DB
    review.comments = allComments;
    review.status = 'done';
    review.completedAt = new Date();
    await review.save();

    // Auto-post to GitHub if enabled
    if (settings.autoPostComments && allComments.length > 0) {
      try {
        await postReviewComments(owner, repo, prNumber, pr.head.sha, allComments, settings.githubToken);
        send('posted', { message: 'Comments posted to GitHub' });
      } catch (ghErr) {
        send('warning', { message: `Review saved but GitHub post failed: ${ghErr.message}` });
      }
    }

    send('done', { reviewId: review._id, totalComments: allComments.length });
    res.end();
  } catch (err) {
    console.error('Review error:', err);
    if (review) {
      review.status = 'error';
      review.errorMessage = err.message;
      await review.save().catch(() => {});
    }
    send('error', { message: err.message });
    res.end();
  }
};

/**
 * GET /api/reviews/:id
 */
export const getReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, userId: req.user._id });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, review });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/reviews/:id/post-comments
 * Manually post saved comments to GitHub.
 */
export const postCommentsToGitHub = async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, userId: req.user._id });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    const settings = await Settings.findOne({ userId: req.user._id });
    if (!settings?.githubToken) {
      return res.status(400).json({ success: false, message: 'GitHub token not configured' });
    }

    // Re-fetch PR to get latest commit SHA
    const { getPRDiff } = await import('../services/github.service.js');
    const { pr } = await getPRDiff(review.owner, review.repo, review.prNumber, settings.githubToken);

    const validComments = review.comments.filter((c) => c.path !== 'GENERAL' && c.line);

    if (validComments.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid line-level comments to post' });
    }

    await postReviewComments(
      review.owner,
      review.repo,
      review.prNumber,
      pr.head.sha,
      validComments,
      settings.githubToken
    );

    // Mark comments as posted
    review.comments = review.comments.map((c) => ({ ...c.toObject(), postedToGitHub: true }));
    await review.save();

    res.json({ success: true, message: `Posted ${validComments.length} comments to GitHub` });
  } catch (err) {
    next(err);
  }
};
