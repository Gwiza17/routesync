const axios = require('axios');

/**
 * Haversine straight-line distance fallback (miles).
 */
const haversineMiles = (lat1, lng1, lat2, lng2) => {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
};

/**
 * Uses Google Maps Distance Matrix API if key is set, otherwise falls back to haversine.
 */
const getDistanceMiles = async (originLat, originLng, destLat, destLng) => {
  if (!process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_KEY_HERE') {
    return haversineMiles(originLat, originLng, destLat, destLng);
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;
  const { data } = await axios.get(url, {
    params: {
      origins: `${originLat},${originLng}`,
      destinations: `${destLat},${destLng}`,
      units: 'imperial',
      key: process.env.GOOGLE_MAPS_API_KEY,
    },
  });

  const element = data.rows[0]?.elements[0];
  if (!element || element.status !== 'OK') throw new Error('Could not calculate distance');

  const miles = element.distance.value / 1609.34;
  return parseFloat(miles.toFixed(2));
};

/**
 * Calculates two-leg trip cost:
 *   Leg 1: driver start → passenger pickup
 *   Leg 2: passenger pickup → dropoff
 */
const estimateTripCost = async ({ driverLat, driverLng, pickupLat, pickupLng, dropoffLat, dropoffLng, ratePerMile }) => {
  const [leg1Miles, leg2Miles] = await Promise.all([
    getDistanceMiles(driverLat, driverLng, pickupLat, pickupLng),
    getDistanceMiles(pickupLat, pickupLng, dropoffLat, dropoffLng),
  ]);

  const totalMiles = leg1Miles + leg2Miles;
  const estimatedCost = parseFloat((totalMiles * ratePerMile).toFixed(2));

  return { leg1Miles, leg2Miles, totalMiles, estimatedCost };
};

module.exports = { getDistanceMiles, estimateTripCost };
