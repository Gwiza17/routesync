const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const { getDriverByCode, getDriverSchedule, getAvailableDrivers, addScheduleSlot, deleteScheduleSlot, updateDriverProfile, getMyPassengers, linkPassenger, removePassenger } = require('../controllers/driverController');

// Static routes first — must come before /:code to avoid param conflicts
router.get('/available',                  getAvailableDrivers);
router.get('/passengers',                 auth, requireRole('driver'),    getMyPassengers);
router.post('/passengers/link',           auth, requireRole('passenger'), linkPassenger);
router.delete('/passengers/:passengerId', auth, requireRole('driver'),    removePassenger);
router.post('/schedule',                  auth, requireRole('driver'),    addScheduleSlot);
router.delete('/schedule/:id',            auth, requireRole('driver'),    deleteScheduleSlot);
router.put('/profile',                    auth, requireRole('driver'),    updateDriverProfile);

// Param routes last
router.get('/:code', getDriverByCode);
router.get('/:code/schedule', getDriverSchedule);

module.exports = router;
