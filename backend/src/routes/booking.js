const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { estimateCost, createBooking, getMyBookings, updateBookingStatus } = require('../controllers/bookingController');

router.post('/estimate', estimateCost);
router.post('/', auth, createBooking);
router.get('/my', auth, getMyBookings);
router.patch('/:id/status', auth, updateBookingStatus);

module.exports = router;
