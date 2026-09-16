import { haversineDistanceKm, nearestRestaurant } from './location.js';

describe('location helpers', () => {
  test('calcola la sede più vicina usando coordinate reali', () => {
    const result = nearestRestaurant(
      [
        { name: 'Duomo', location: { lat: 45.4642, lng: 9.19 } },
        { name: 'Navigli', location: { lat: 45.448, lng: 9.17 } }
      ],
      { lat: 45.463, lng: 9.189 }
    );

    expect(result.restaurant.name).toBe('Duomo');
    expect(result.distanceKm).toBeLessThan(1);
  });

  test('ignora le filiali non ancora geocodificate', () => {
    expect(nearestRestaurant([{ name: 'Da geocodificare' }], { lat: 45, lng: 9 })).toBeNull();
    expect(haversineDistanceKm({ lat: 45, lng: 9 }, { lat: 45, lng: 9 })).toBe(0);
  });
});
