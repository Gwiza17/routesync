const { v4: uuidv4 } = require('uuid');

/**
 * Generates a unique driver code like RS-AB1234
 */
const generateDriverCode = () => {
  const letters = uuidv4().replace(/-/g, '').slice(0, 2).toUpperCase();
  const digits = uuidv4().replace(/-/g, '').slice(0, 4).toUpperCase();
  return `RS-${letters}${digits}`;
};

module.exports = { generateDriverCode };
