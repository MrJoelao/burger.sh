const { geocodeAddress } = require('@services/osmService');

/* test unitari di osmService: mocka la fetch globale così nessun test parla
   davvero con Nominatim. verifica sia il percorso positivo (coordinate
   trovate) sia i casi di errore che il chiamante (deliveryService) deve
   poter distinguere tramite statusCode (422 = indirizzo non valido,
   502 = servizio OpenStreetMap non raggiungibile/non disponibile). */
describe('osmService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('geocodeAddress', () => {
    test('restituisce lat/lng numeriche dal primo risultato di Nominatim', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ lat: '45.1847', lon: '9.1582' }])
      });

      const location = await geocodeAddress('Via Roma 1, Milano');

      expect(location).toEqual({ lat: 45.1847, lng: 9.1582 });
    });

    test('invia uno User-Agent, come richiesto dalla policy di Nominatim', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ lat: '45.0', lon: '9.0' }])
      });

      await geocodeAddress('Via Roma 1, Milano');

      const [, options] = global.fetch.mock.calls[0];
      expect(options.headers['User-Agent']).toBeTruthy();
    });

    test('rifiuta con statusCode 422 un indirizzo vuoto, senza contattare il servizio esterno', async () => {
      global.fetch = jest.fn();

      await expect(geocodeAddress('   ')).rejects.toMatchObject({ statusCode: 422 });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('rifiuta con statusCode 422 se Nominatim non trova alcun risultato', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      await expect(geocodeAddress('indirizzo inesistente')).rejects.toMatchObject({ statusCode: 422 });
    });

    test('rifiuta con statusCode 502 se Nominatim risponde con un errore http', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });

      await expect(geocodeAddress('Via Roma 1, Milano')).rejects.toMatchObject({ statusCode: 502 });
    });

    test('rifiuta con statusCode 502 se il servizio è irraggiungibile', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('network error'));

      await expect(geocodeAddress('Via Roma 1, Milano')).rejects.toMatchObject({ statusCode: 502 });
    });
  });
});
