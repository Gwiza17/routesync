const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');

const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.passengerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const amount = Math.round(parseFloat(booking.estimatedCost) * 100); // cents

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: { bookingId: booking.id },
    });

    await booking.update({ stripePaymentIntentId: intent.id });
    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const booking = await Booking.findOne({ where: { stripePaymentIntentId: intent.id } });
    if (booking) await booking.update({ status: 'confirmed', paidAt: new Date() });
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    const booking = await Booking.findOne({ where: { stripePaymentIntentId: intent.id } });
    if (booking) await booking.update({ status: 'cancelled' });
  }

  res.json({ received: true });
};

module.exports = { createPaymentIntent, stripeWebhook };
