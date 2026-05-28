const express = require('express');
const {
  analyzeProfile,
  listProfiles,
  getProfile,
  refreshProfile,
  deleteProfile
} = require('../controllers/profileController');

const router = express.Router();

router.post('/analyze', analyzeProfile);
router.get('/', listProfiles);
router.get('/:username', getProfile);
router.post('/:username/refresh', refreshProfile);
router.delete('/:username', deleteProfile);

module.exports = router;
