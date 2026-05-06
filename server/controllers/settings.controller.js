import Settings from '../models/Settings.js';

/**
 * GET /api/settings
 */
export const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ userId: req.user._id });

    // Auto-create settings if somehow missing
    if (!settings) {
      settings = await Settings.create({ userId: req.user._id });
    }

    res.json({ success: true, settings: settings.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/settings
 * Accepts: { githubToken, geminiModel, autoPostComments }
 */
export const updateSettings = async (req, res, next) => {
  try {
    const { githubToken, geminiModel, autoPostComments } = req.body;

    let settings = await Settings.findOne({ userId: req.user._id });
    if (!settings) {
      settings = new Settings({ userId: req.user._id });
    }

    // Only update fields that were sent
    if (githubToken !== undefined) settings.githubToken = githubToken;
    if (geminiModel !== undefined) settings.geminiModel = geminiModel;
    if (autoPostComments !== undefined) settings.autoPostComments = autoPostComments;

    await settings.save();

    res.json({ success: true, settings: settings.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};
