const router = require('express').Router();
const { register, login } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

router.post('/register', register);
router.post('/login', login);

router.post('/push-token', auth, async (req, res) => {
  try {
    await User.update({ expoPushToken: req.body.token }, { where: { id: req.user.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
