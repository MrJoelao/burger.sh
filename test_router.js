const { matchRoute } = require('./frontend/src/router/AppRouter.js');
console.log('Match for /menu/:', matchRoute('/menu/'));
console.log('Match for /orders/menu/123:', matchRoute('/orders/menu/123'));