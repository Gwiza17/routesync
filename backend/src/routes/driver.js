const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const { getDriverByCode, getDriverSchedule, addScheduleSlot, deleteScheduleSlot, updateDriverProfile } = require('../controllers/driverController');

router.get('/:code', getDriverByCode);
router.get('/:code/schedule', getDriverSchedule);
router.post('/schedule', auth, requireRole('driver'), addScheduleSlot);
router.delete('/schedule/:id', auth, requireRole('driver'), deleteScheduleSlot);
router.put('/profile', auth, requireRole('driver'), updateDriverProfile);

module.exports = router;
