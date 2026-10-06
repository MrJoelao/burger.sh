/*
 * navigate - SPA navigation primitive
 * updates the history entry and notifies the router listener without a full page reload
 */

export function navigate(to) {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default navigate;
