const { httpError } = require('../utils/httpResponses');

/* unico punto del codice che parla con OpenStreetMap: stima le coordinate
   di un indirizzo tramite l'API di ricerca di Nominatim
   (architecture-and-flows.md §6). deliveryService dipende solo da
   geocodeAddress e non conosce i dettagli dell'API usata (endpoint, header
   richiesti dalla policy di utilizzo, formato della risposta). */

const NOMINATIM_URL = process.env.OSM_NOMINATIM_URL || 'https://nominatim.openstreetmap.org';

/* Nominatim richiede uno User-Agent (o Referer) identificativo per ogni
   richiesta: senza, le richieste possono essere bloccate dal servizio
   (https://operations.osmfoundation.org/policies/nominatim/) */
const USER_AGENT = process.env.OSM_USER_AGENT || 'burger.sh (https://github.com/MrJoelao/burger.sh)';

// stima lat/lng di un indirizzo. lancia un errore con statusCode 422 se
// l'indirizzo non è geocodificabile, 502 se il servizio OSM non risponde
async function geocodeAddress(address) {
  if (!address || !address.trim()) {
    throw httpError(422, 'Address is required to estimate the delivery distance');
  }

  const url = `${NOMINATIM_URL}/search?format=json&limit=1&q=${encodeURIComponent(address)}`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });
  } catch (err) {
    throw httpError(502, `OpenStreetMap service is unreachable: ${err.message}`);
  }

  if (!response.ok) {
    throw httpError(502, `OpenStreetMap service responded with status ${response.status}`);
  }

  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) {
    throw httpError(422, `Address not found: ${address}`);
  }

  const { lat, lon } = results[0];
  return { lat: Number(lat), lng: Number(lon) };
}

module.exports = { geocodeAddress };
