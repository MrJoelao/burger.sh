/**
 * Toast - Notification toast component
 */

import { html } from '../../utils/htm.js';
import { useState, useEffect, useRef } from 'preact/hooks';

export function Toast() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const toastRef = useRef(null);
  let timeoutRef = null;

  const show = (msg, duration = 1700) => {
    if (timeoutRef) clearTimeout(timeoutRef);
    setMessage(msg);
    setVisible(true);
    timeoutRef = setTimeout(() => {
      setVisible(false);
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef) clearTimeout(timeoutRef);
    };
  }, []);

  if (!visible) return null;

  return html`
    <div class="toast show" ref=${toastRef} role="status">
      ${message}
    </div>
  `;
}

// Export a hook for using toast globally
export function useToast() {
  const [toastApi, setToastApi] = useState(null);

  useEffect(() => {
    // This will be set by the ToastProvider
  }, []);

  return toastApi || { show: () => {} };
}

export default Toast;