const osmService = require('./osmService');
const Restaurant = require('../models/Restaurant');
const { httpError } = require('../utils/httpResponses');

/* calcolo del costo di consegna lato server (architecture-and-flows.md §6 e
   §8.4): la distanza tra filiale e indirizzo del cliente è stimata in linea
   d'aria (Haversine) a partire dalle coordinate geocodificate tramite
   osmService, e il costo è ricavato da una tariffa a scaglioni. il
   controller non deve mai fidarsi di distanceKm/deliveryFee inviati dal
   client, sullo stesso principio già usato per unitPrice/totalAmount degli
   ordini (vedi orderService). */

const EARTH_RADIUS_KM = 6371;

/* tariffa a scaglioni: il primo scaglione la cui distanza massima copre la
   distanza calcolata determina il costo di consegna. oltre l'ultimo
   scaglione la filiale non consegna: l'ordine va rifiutato, mai accettato
   con un costo indeterminato (vedi calculateDelivery) */
const DELIVERY_FEE_BRACKETS = [
  { maxKm: 2, fee: 1.5 },
  { maxKm: 5, fee: 2.5 },
  { maxKm: 10, fee: 4 },
  { maxKm: 15, fee: 6 }
];

const MAX_DELIVERY_DISTANCE_KM = DELIVERY_FEE_BRACKETS[DELIVERY_FEE_BRACKETS.length - 1].maxKm;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

// distanza in linea d'aria tra due coordinate {lat, lng}, in km (formula dell'emisenoverso)
function haversineDistanceKm(from, to) {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const centralAngle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * centralAngle;
}

// primo scaglione la cui distanza massima copre distanceKm, o null se supera la distanza massima servita
function feeForDistance(distanceKm) {
  const bracket = DELIVERY_FEE_BRACKETS.find((b) => distanceKm <= b.maxKm);
  return bracket ? bracket.fee : null;
}

/* garantisce che la filiale abbia una location geocodificata, calcolandola
   una sola volta e salvandola sul documento: le richieste di consegna
   successive per la stessa filiale non richiamano più osmService */
async function ensureRestaurantLocation(restaurant) {
  if (restaurant.location && Number.isFinite(restaurant.location.lat) && Number.isFinite(restaurant.location.lng)) {
    return restaurant.location;
  }

  const location = await osmService.geocodeAddress(`${restaurant.address}, ${restaurant.city}`);
  restaurant.location = location;
  await Restaurant.updateOne({ _id: restaurant._id }, { $set: { location } });

  return location;
}

/* calcola distanza e costo di consegna per un ordine a domicilio.
   restaurant deve avere almeno _id, address e city (ed eventualmente una
   location già geocodificata). lancia un errore http (statusCode 422 o 502,
   vedi osmService) se l'indirizzo non è geocodificabile, il servizio OSM non
   risponde, o la distanza supera quella massima servita: l'ordine va sempre
   rifiutato in questi casi, mai accettato con un costo indeterminato */
async function calculateDelivery(restaurant, address) {
  const restaurantLocation = await ensureRestaurantLocation(restaurant);
  const destinationLocation = await osmService.geocodeAddress(address);

  const distanceKm = Math.round(haversineDistanceKm(restaurantLocation, destinationLocation) * 100) / 100;
  const deliveryFee = feeForDistance(distanceKm);

  if (deliveryFee === null) {
    throw httpError(
      422,
      `Delivery address is ${distanceKm}km away, farther than the maximum served distance of ${MAX_DELIVERY_DISTANCE_KM}km`
    );
  }

  return { distanceKm, deliveryFee };
}

module.exports = {
  DELIVERY_FEE_BRACKETS,
  MAX_DELIVERY_DISTANCE_KM,
  haversineDistanceKm,
  calculateDelivery
};
