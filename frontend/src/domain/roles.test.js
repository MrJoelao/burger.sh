import { describe, test, expect } from 'vitest';
import { dashboardPathFor, adminCanVisit, redirectFor, ADMIN_HOME } from './roles.js';

describe('dashboardPathFor', () => {
  test('admin atterra sulla dashboard admin', () => {
    expect(dashboardPathFor('admin')).toBe('/dashboard/admin');
  });

  test('manager atterra sulla dashboard manager', () => {
    expect(dashboardPathFor('manager')).toBe('/dashboard/manager');
  });

  test('customer atterra sulla dashboard cliente', () => {
    expect(dashboardPathFor('customer')).toBe('/dashboard');
  });

  test('ruolo assente o sconosciuto atterra sulla home', () => {
    expect(dashboardPathFor(undefined)).toBe('/');
    expect(dashboardPathFor('unknown')).toBe('/');
  });
});

describe('adminCanVisit', () => {
  test('consente la console admin, il profilo, il cambio password e il dettaglio ordine', () => {
    ['/dashboard/admin', '/admin/users', '/admin/branches', '/admin/stats', '/profile', '/change-password', '/orders/abc123']
      .forEach(path => expect(adminCanVisit(path)).toBe(true));
  });

  test('nega lo storefront e le aree cliente o manager', () => {
    ['/', '/menu', '/restaurants', '/orders', '/orders/confirm', '/dashboard', '/dashboard/manager', '/manager/orders']
      .forEach(path => expect(adminCanVisit(path)).toBe(false));
  });
});

describe('redirectFor', () => {
  test('manda al cambio password l admin non ancora sbloccato', () => {
    expect(redirectFor({ role: 'admin', mustChangePassword: true }, '/dashboard/admin')).toBe('/change-password');
    expect(redirectFor({ role: 'admin', mustChangePassword: true }, '/change-password')).toBeNull();
    expect(redirectFor({ role: 'admin', mustChangePassword: true }, '/setup')).toBeNull();
  });

  test('riporta l admin alla dashboard dalle rotte non sue', () => {
    expect(redirectFor({ role: 'admin' }, '/')).toBe(ADMIN_HOME);
    expect(redirectFor({ role: 'admin' }, '/menu')).toBe(ADMIN_HOME);
    expect(redirectFor({ role: 'admin' }, '/dashboard/admin')).toBeNull();
    expect(redirectFor({ role: 'admin' }, '/admin/users')).toBeNull();
  });

  test('non tocca cliente e manager', () => {
    expect(redirectFor({ role: 'customer' }, '/')).toBeNull();
    expect(redirectFor({ role: 'manager' }, '/dashboard/manager')).toBeNull();
    expect(redirectFor(null, '/')).toBeNull();
  });
});
