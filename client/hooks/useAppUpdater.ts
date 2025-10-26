import { useEffect, useState } from 'react';

export function useAppUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    // Check for updates periodically
    const checkForUpdates = async () => {
      try {
        registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      } catch (err) {
        console.error('Failed to check for updates:', err);
      }
    };

    // Initial check when component mounts
    checkForUpdates();

    // Listen for new service worker
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      setUpdateAvailable(true);
    });

    // Check for updates every 30 seconds
    const interval = setInterval(checkForUpdates, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          // Tell the service worker to skip waiting
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
    // Reload after a short delay to allow SW to take control
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return { updateAvailable, refreshing, handleRefresh };
}
