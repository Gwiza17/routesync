const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const {
  createRideRequest,
  acceptRideRequest,
  declineRideRequest,
  cancelRideRequest,
  getRideRequest,
} = require('../controllers/rideRequestController');

router.post('/',              auth, requireRole('passenger'), createRideRequest);
router.get('/:id',            auth, getRideRequest);
router.post('/:id/accept',    auth, requireRole('driver'),    acceptRideRequest);
router.post('/:id/decline',   auth, requireRole('driver'),    declineRideRequest);
router.delete('/:id',         auth, requireRole('passenger'), cancelRideRequest);

module.exports = router;
