const profileModel = require('../models/profileModel');
const { analyzeUsername } = require('../services/analyzerService');

const USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    const err = new Error('username is required');
    err.status = 400;
    throw err;
  }
  if (!USERNAME_REGEX.test(username)) {
    const err = new Error('Invalid GitHub username format');
    err.status = 400;
    throw err;
  }
}

/**
 * Parse JSON columns coming back from MySQL so the API response is fully shaped.
 */
function shapeProfile(row) {
  if (!row) return null;
  const shaped = { ...row };
  if (typeof shaped.languages_json === 'string') {
    try {
      shaped.languages_json = JSON.parse(shaped.languages_json);
    } catch {
      // leave as-is
    }
  }
  return shaped;
}

/**
 * POST /api/profiles/analyze
 * Body: { username: "octocat" }
 */
async function analyzeProfile(req, res, next) {
  try {
    const username = (req.body?.username || '').trim();
    validateUsername(username);

    const insights = await analyzeUsername(username);
    const saved = await profileModel.upsertProfile(insights);

    res.status(201).json({
      success: true,
      message: `Profile for '${username}' analyzed and saved.`,
      data: shapeProfile(saved)
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/profiles
 */
async function listProfiles(req, res, next) {
  try {
    const { limit, offset, sort, order } = req.query;
    const result = await profileModel.findAll({ limit, offset, sort, order });
    res.json({
      success: true,
      count: result.items.length,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      data: result.items
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/profiles/:username
 */
async function getProfile(req, res, next) {
  try {
    const { username } = req.params;
    validateUsername(username);
    const profile = await profileModel.findByUsername(username);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: `Profile for '${username}' not found. Try POST /api/profiles/analyze first.`
      });
    }
    res.json({ success: true, data: shapeProfile(profile) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/profiles/:username/refresh
 * Re-runs analysis for a known profile and updates DB.
 */
async function refreshProfile(req, res, next) {
  try {
    const { username } = req.params;
    validateUsername(username);
    const insights = await analyzeUsername(username);
    const saved = await profileModel.upsertProfile(insights);
    res.json({
      success: true,
      message: `Profile for '${username}' refreshed.`,
      data: shapeProfile(saved)
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/profiles/:username
 */
async function deleteProfile(req, res, next) {
  try {
    const { username } = req.params;
    validateUsername(username);
    const removed = await profileModel.deleteByUsername(username);
    if (!removed) {
      return res.status(404).json({ success: false, error: `Profile for '${username}' not found.` });
    }
    res.json({ success: true, message: `Profile for '${username}' deleted.` });
  } catch (err) {
    next(err);
  }
}

module.exports = { analyzeProfile, listProfiles, getProfile, refreshProfile, deleteProfile };
