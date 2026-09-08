let toastListeners = [];

export function addToast(message, type = 'info', duration = 3000) {
  const id = Date.now() + Math.random();
  toastListeners.forEach((listener) => listener({ id, message, type }));
  if (duration > 0) {
    setTimeout(() => {
      toastListeners.forEach((listener) => listener({ id, remove: true }));
    }, duration);
  }
  return id;
}

export function subscribeToToasts(listener) {
  toastListeners.push(listener);
  return () => {
    toastListeners = toastListeners.filter((l) => l !== listener);
  };
}
