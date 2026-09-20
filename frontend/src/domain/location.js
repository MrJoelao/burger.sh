const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

export function haversineDistanceKm(from, to) {
  const latitudeDelta = toRadians(to.lat - from.lat);
  const longitudeDelta = toRadians(to.lng - from.lng);
  const fromLatitude = toRadians(from.lat);
  const toLatitude = toRadians(to.lat);
  const sine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(sine), Math.sqrt(1 - sine));
}

export function nearestRestaurant(restaurants, userLocation) {
  return restaurants
    .filter(restaurant => Number.isFinite(restaurant.location?.lat) && Number.isFinite(restaurant.location?.lng))
    .map(restaurant => ({
      restaurant,
      distanceKm: haversineDistanceKm(userLocation, restaurant.location)
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm)[0] || null;
}
