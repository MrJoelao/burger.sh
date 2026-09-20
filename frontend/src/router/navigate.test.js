/* test di navigate */

import { navigate } from './navigate.js';

describe('navigate', () => {
  test('pushes the target path onto history', () => {
    const pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => {});

    navigate('/menu');

    expect(pushState).toHaveBeenCalledWith({}, '', '/menu');
    pushState.mockRestore();
  });

  test('notifies the router with a popstate event', () => {
    const pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
    const dispatchEvent = vi.spyOn(window, 'dispatchEvent').mockImplementation(() => {});

    navigate('/auth');

    expect(dispatchEvent.mock.calls[0][0].type).toBe('popstate');
    pushState.mockRestore();
    dispatchEvent.mockRestore();
  });
});
