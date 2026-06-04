const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { getMessages, getMyChats, deleteChat, initiateCall } = require('../controllers/chatController');

// Static routes before /:bookingId to avoid param conflict
router.get('/my',               auth, getMyChats);
router.get('/:bookingId',       auth, getMessages);
router.post('/:bookingId/call', auth, initiateCall);
router.delete('/:bookingId',    auth, deleteChat);

module.exports = router;
