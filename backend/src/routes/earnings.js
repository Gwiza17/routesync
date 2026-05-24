const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const { getSummary, getHistory } = require('../controllers/earningsController');

router.get('/summary', auth, requireRole('driver'), getSummary);
router.get('/history', auth, requireRole('driver'), getHistory);

module.exports = router;
