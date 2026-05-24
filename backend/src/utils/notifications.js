const axios = require('axios');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  if (!expoPushToken) return;
  try {
    await axios.post(EXPO_PUSH_URL, {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    });
  } catch (err) {
    console.error('Push notification error:', err.message);
  }
};

const sendBulk = async (tokens, title, body, data = {}) => {
  const valid = tokens.filter(Boolean);
  if (!valid.length) return;
  // Chunk into batches of 100
  const chunks = [];
  for (let i = 0; i < valid.length; i += 100) chunks.push(valid.slice(i, i + 100));
  await Promise.all(chunks.map(chunk =>
    axios.post(EXPO_PUSH_URL, chunk.map(to => ({ to, sound: 'default', title, body, data })))
  ));
};

module.exports = { sendPushNotification, sendBulk };
