const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { estimateCost, geocode, createBooking, getMyBookings, updateBookingStatus, markStopArrived } = require('../controllers/bookingController');

router.get('/geocode', geocode);
router.post('/estimate', estimateCost);
router.post('/', auth, createBooking);
router.get('/my', auth, getMyBookings);
router.patch('/:id/status', auth, updateBookingStatus);
router.post('/:id/stops/:stopId/arrived', auth, markStopArrived);

module.exports = router;
