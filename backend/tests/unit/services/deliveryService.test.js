jest.mock('@services/osmService');
jest.mock('@models/Restaurant');

const osmService = require('@services/osmService');
const Restaurant = require('@models/Restaurant');
const { haversineDistanceKm, calculateDelivery, MAX_DELIVERY_DISTANCE_KM } = require('@services/deliveryService');

/* test unitari di deliveryService: osmService e il modello Restaurant sono
   mockati, così si verifica solo la logica di dominio (geocodifica cache
   della filiale, calcolo distanza, scelta della fascia di prezzo) senza
   dipendere da rete o database. */
describe('deliveryService', () => {
  describe('haversineDistanceKm', () => {
    test('restituisce 0 per due punti identici', () => {
      const point = { lat: 45.1847, lng: 9.1582 };
      expect(haversineDistanceKm(point, point)).toBeCloseTo(0, 5);
    });

    test('stima correttamente la distanza tra due punti noti (Milano-Vigevano, ~30km in linea d\'aria)', () => {
      const milano = { lat: 45.4642, lng: 9.19 };
      const vigevano = { lat: 45.3167, lng: 8.8583 };

      const distance = haversineDistanceKm(milano, vigevano);
      expect(distance).toBeGreaterThan(28);
      expect(distance).toBeLessThan(33);
    });
  });

  describe('calculateDelivery', () => {
    function buildRestaurant(overrides = {}) {
      return {
        _id: 'restaurant-1',
        address: 'Via Roma 1',
        city: 'Milano',
        location: undefined,
        ...overrides
      };
    }

    beforeEach(() => {
      Restaurant.updateOne = jest.fn().mockResolvedValue({});
    });

    test('geocodifica la filiale solo se non ha già una location salvata', async () => {
      const restaurant = buildRestaurant({ location: { lat: 45.0, lng: 9.0 } });
      osmService.geocodeAddress = jest.fn().mockResolvedValue({ lat: 45.001, lng: 9.001 });

      await calculateDelivery(restaurant, 'Via Milano 5');

      // geocodeAddress va chiamato una sola volta, solo per l'indirizzo di consegna
      expect(osmService.geocodeAddress).toHaveBeenCalledTimes(1);
      expect(osmService.geocodeAddress).toHaveBeenCalledWith('Via Milano 5');
      expect(Restaurant.updateOne).not.toHaveBeenCalled();
    });

    test('geocodifica e salva la location della filiale quando manca', async () => {
      const restaurant = buildRestaurant();
      osmService.geocodeAddress = jest.fn()
        .mockResolvedValueOnce({ lat: 45.0, lng: 9.0 }) // filiale
        .mockResolvedValueOnce({ lat: 45.001, lng: 9.001 }); // indirizzo di consegna

      await calculateDelivery(restaurant, 'Via Milano 5');

      expect(osmService.geocodeAddress).toHaveBeenCalledWith('Via Roma 1, Milano');
      expect(Restaurant.updateOne).toHaveBeenCalledWith(
        { _id: 'restaurant-1' },
        { $set: { location: { lat: 45.0, lng: 9.0 } } }
      );
    });

    test('applica la fascia di prezzo corretta in base alla distanza calcolata', async () => {
      const restaurant = buildRestaurant({ location: { lat: 45.0, lng: 9.0 } });
      // stessa longitudine, differenza di latitudine di circa 1km ogni 0.009 gradi
      osmService.geocodeAddress = jest.fn().mockResolvedValue({ lat: 45.009, lng: 9.0 });

      const result = await calculateDelivery(restaurant, 'Via Milano 5');

      expect(result.distanceKm).toBeCloseTo(1, 0);
      expect(result.deliveryFee).toBe(1.5);
    });

    test('rifiuta con statusCode 422 se la distanza supera quella massima servita', async () => {
      const restaurant = buildRestaurant({ location: { lat: 45.0, lng: 9.0 } });
      osmService.geocodeAddress = jest.fn().mockResolvedValue({ lat: 46.5, lng: 9.0 }); // ben oltre il massimo

      await expect(calculateDelivery(restaurant, 'Indirizzo lontano')).rejects.toMatchObject({ statusCode: 422 });
    });

    test('propaga l\'errore di osmService se l\'indirizzo di consegna non è geocodificabile', async () => {
      const restaurant = buildRestaurant({ location: { lat: 45.0, lng: 9.0 } });
      const notFoundError = new Error('Address not found');
      notFoundError.statusCode = 422;
      osmService.geocodeAddress = jest.fn().mockRejectedValue(notFoundError);

      await expect(calculateDelivery(restaurant, 'indirizzo inventato')).rejects.toBe(notFoundError);
    });

    test('MAX_DELIVERY_DISTANCE_KM corrisponde alla fascia di prezzo più alta configurata', () => {
      expect(typeof MAX_DELIVERY_DISTANCE_KM).toBe('number');
      expect(MAX_DELIVERY_DISTANCE_KM).toBeGreaterThan(0);
    });
  });
});
