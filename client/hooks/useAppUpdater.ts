import { useEffect, useRef, useState } from "react";

export function useAppUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Check for updates periodically
    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          swRegistrationRef.current = registration;
          await registration.update();
        }
      } catch (err) {
        console.error("Failed to check for updates:", err);
      }
    };

    // Initial check when component mounts
    checkForUpdates();

    // Listen for new service worker
    const handleControllerChange = () => {
      setUpdateAvailable(true);
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    );

    // Check for updates every 30 seconds
    const interval = setInterval(checkForUpdates, 30000);

    return () => {
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    if ("serviceWorker" in navigator && swRegistrationRef.current?.waiting) {
      // Tell the service worker to skip waiting
      swRegistrationRef.current.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    // Reload after a short delay to allow SW to take control
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return { updateAvailable, refreshing, handleRefresh };
}
