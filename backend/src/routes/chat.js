const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { getMessages, initiateCall } = require('../controllers/chatController');

router.get('/:bookingId',       auth, getMessages);
router.post('/:bookingId/call', auth, initiateCall);

module.exports = router;
