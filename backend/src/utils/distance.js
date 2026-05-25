const axios = require('axios');

const hasGoogleKey = () =>
  process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_KEY_HERE';

/**
 * Haversine straight-line distance fallback (miles).
 */
const haversineMiles = (lat1, lng1, lat2, lng2) => {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
};

/**
 * Returns distance in miles and duration in minutes between two points.
 */
const getDistanceAndDuration = async (originLat, originLng, destLat, destLng) => {
  if (!hasGoogleKey()) {
    return { miles: haversineMiles(originLat, originLng, destLat, destLng), durationMinutes: null };
  }

  const { data } = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
    params: {
      origins: `${originLat},${originLng}`,
      destinations: `${destLat},${destLng}`,
      units: 'imperial',
      mode: 'driving',
      key: process.env.GOOGLE_MAPS_API_KEY,
    },
  });

  const element = data.rows[0]?.elements[0];
  if (!element || element.status !== 'OK') {
    // Fall back to straight-line distance if Maps API can't route
    return { miles: haversineMiles(originLat, originLng, destLat, destLng), durationMinutes: null };
  }

  const miles = parseFloat((element.distance.value / 1609.34).toFixed(2));
  const durationMinutes = Math.ceil(element.duration.value / 60);
  return { miles, durationMinutes };
};

/**
 * Autocomplete an address string using Places Autocomplete + place details.
 * Returns { address, latitude, longitude }[]
 */
const geocodeAddress = async (address) => {
  if (!hasGoogleKey()) {
    throw new Error('Google Maps API key required for geocoding');
  }

  // Step 1: get autocomplete suggestions (actual address strings, not zip codes)
  const { data: acData } = await axios.get(
    'https://maps.googleapis.com/maps/api/place/autocomplete/json',
    {
      params: {
        input: address,
        types: 'address',
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    }
  );

  if (acData.status !== 'OK' || !acData.predictions.length) {
    // Fallback to geocoding — filter out postal_code-only results
    const { data } = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { address, result_type: 'street_address|route|premise|subpremise|neighborhood|locality', key: process.env.GOOGLE_MAPS_API_KEY },
    });
    if (data.status !== 'OK' || !data.results.length) return [];
    return data.results
      .filter(r => !r.types.includes('postal_code'))
      .slice(0, 5)
      .map(r => ({
        address: r.formatted_address,
        latitude: r.geometry.location.lat,
        longitude: r.geometry.location.lng,
      }));
  }

  // Step 2: fetch lat/lng for each prediction via place details
  const results = await Promise.all(
    acData.predictions.slice(0, 5).map(async (pred) => {
      try {
        const { data: detailData } = await axios.get(
          'https://maps.googleapis.com/maps/api/place/details/json',
          {
            params: {
              place_id: pred.place_id,
              fields: 'formatted_address,geometry',
              key: process.env.GOOGLE_MAPS_API_KEY,
            },
          }
        );
        if (detailData.status !== 'OK') return null;
        const loc = detailData.result.geometry.location;
        return {
          address: detailData.result.formatted_address,
          latitude: loc.lat,
          longitude: loc.lng,
        };
      } catch {
        return null;
      }
    })
  );

  return results.filter(Boolean);
};

/**
 * Two-leg trip cost estimation.
 * Leg 1: driver start → pickup
 * Leg 2: pickup → dropoff
 */
const estimateTripCost = async ({ driverLat, driverLng, pickupLat, pickupLng, dropoffLat, dropoffLng, ratePerMile }) => {
  const [leg1, leg2] = await Promise.all([
    getDistanceAndDuration(driverLat, driverLng, pickupLat, pickupLng),
    getDistanceAndDuration(pickupLat, pickupLng, dropoffLat, dropoffLng),
  ]);

  const totalMiles = leg1.miles + leg2.miles;
  const estimatedCost = parseFloat((totalMiles * ratePerMile).toFixed(2));

  return {
    leg1Miles: leg1.miles,
    leg1DurationMinutes: leg1.durationMinutes,
    leg2Miles: leg2.miles,
    leg2DurationMinutes: leg2.durationMinutes,
    totalMiles,
    estimatedCost,
  };
};

module.exports = { getDistanceAndDuration, geocodeAddress, estimateTripCost };
