import Settings from '../models/Settings.js';
const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * GET /api/settings
 */
export const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ userId: req.user._id });

    // Auto-create settings if somehow missing
    if (!settings) {
      settings = await Settings.create({ userId: req.user._id });
    } else if (settings.geminiModel !== DEFAULT_GROQ_MODEL) {
      // Migrate models saved while Gemini, OpenRouter, or Grok was configured.
      settings.geminiModel = DEFAULT_GROQ_MODEL;
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
    // The configured Groq model is controlled by the server environment.
    settings.geminiModel = DEFAULT_GROQ_MODEL;
    if (autoPostComments !== undefined) settings.autoPostComments = autoPostComments;

    await settings.save();

    res.json({ success: true, settings: settings.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};
