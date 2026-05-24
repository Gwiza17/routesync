const router = require('express').Router();
const express = require('express');
const { auth } = require('../middleware/auth');
const { createPaymentIntent, stripeWebhook } = require('../controllers/paymentController');

router.post('/create-intent', auth, createPaymentIntent);
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;
