const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { submitRating, getDriverRatings } = require('../controllers/ratingController');

router.post('/', auth, submitRating);
router.get('/driver/:userId', getDriverRatings);

module.exports = router;
