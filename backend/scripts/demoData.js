const DEMO_PASSWORD = 'DemoPassword123!';

const demoRestaurants = [
  {
    key: 'citta-studi-uno',
    name: 'Burger.sh Citta Studi',
    address: 'Via Celoria 2',
    city: 'Milano',
    zip: '20133',
    phone: '+39 02 1234 5601',
    vatNumber: 'IT09900010001',
    location: { lat: 45.4787, lng: 9.2272 },
    manager: {
      name: 'Luca',
      surname: 'Bianchi',
      email: 'manager.cittastudi1@demo.burger.sh',
    },
  },
  {
    key: 'citta-studi-due',
    name: 'Burger.sh Leonardo',
    address: 'Piazza Leonardo da Vinci 32',
    city: 'Milano',
    zip: '20133',
    phone: '+39 02 1234 5602',
    vatNumber: 'IT09900010002',
    location: { lat: 45.4781, lng: 9.2294 },
    manager: {
      name: 'Sara',
      surname: 'Rossi',
      email: 'manager.cittastudi2@demo.burger.sh',
    },
  },
  {
    key: 'citta-studi-tre',
    name: 'Burger.sh Bassini',
    address: 'Via Bassini 25',
    city: 'Milano',
    zip: '20133',
    phone: '+39 02 1234 5603',
    vatNumber: 'IT09900010003',
    location: { lat: 45.4772, lng: 9.2298 },
    manager: {
      name: 'Marco',
      surname: 'Verdi',
      email: 'manager.cittastudi3@demo.burger.sh',
    },
  },
];

module.exports = { DEMO_PASSWORD, demoRestaurants };
