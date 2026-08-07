import Settings from '../models/Settings.js';
const DEFAULT_NEMOTRON_MODEL = process.env.NEMOTRON_MODEL || 'nvidia/llama-3.1-nemotron-ultra-253b-v1';

/**
 * GET /api/settings
 */
export const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ userId: req.user._id });

    // Auto-create settings if somehow missing
    if (!settings) {
      settings = await Settings.create({ userId: req.user._id });
    } else if (settings.geminiModel !== DEFAULT_NEMOTRON_MODEL) {
      // Migrate models saved while Gemini, OpenRouter, or Grok was configured.
      settings.geminiModel = DEFAULT_NEMOTRON_MODEL;
      await settings.save();
    }

    res.json({ success: true, settings: settings.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/settings
 * Accepts: { githubToken, autoPostComments }
 */
export const updateSettings = async (req, res, next) => {
  try {
    const { githubToken, autoPostComments } = req.body;

    let settings = await Settings.findOne({ userId: req.user._id });
    if (!settings) {
      settings = new Settings({ userId: req.user._id });
    }

    // Only update fields that were sent
    if (githubToken !== undefined) settings.githubToken = githubToken;
    // The configured Nemotron model is controlled by the server environment.
    settings.geminiModel = DEFAULT_NEMOTRON_MODEL;
    if (autoPostComments !== undefined) settings.autoPostComments = autoPostComments;

    await settings.save();

    res.json({ success: true, settings: settings.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};
