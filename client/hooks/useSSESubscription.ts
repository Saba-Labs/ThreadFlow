import { useEffect, useRef } from "react";

type DataChangeCallback = (event: {
  type:
    | "pipeline_updated"
    | "jobworks_updated"
    | "machine_types_updated"
    | "restok_updated"
    | "roadmaps_updated";
}) => void;

export function useSSESubscription(onDataChange: DataChangeCallback) {
  const callbackRef = useRef(onDataChange);
  const sseFailedRef = useRef(false);
  const connectAttemptsRef = useRef(0);

  useEffect(() => {
    callbackRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let pollingInterval: NodeJS.Timeout | null = null;

    function setupPollingFallback() {
      console.log(
        "[SSE Fallback] SSE not available, switching to polling every 2 seconds",
      );
      sseFailedRef.current = true;
      connectAttemptsRef.current = 0;

      pollingInterval = setInterval(() => {
        callbackRef.current({ type: "pipeline_updated" });
        callbackRef.current({ type: "jobworks_updated" });
        callbackRef.current({ type: "machine_types_updated" });
        callbackRef.current({ type: "restok_updated" });
        callbackRef.current({ type: "roadmaps_updated" });
      }, 2000);
    }

    function connect() {
      try {
        connectAttemptsRef.current += 1;
        console.log(
          `[SSE] Connection attempt ${connectAttemptsRef.current}`,
        );
        eventSource = new EventSource("/api/subscribe");

        eventSource.onopen = () => {
          console.log("[SSE] Connection established");
          sseFailedRef.current = false;
          connectAttemptsRef.current = 0;
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
          }
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (
              data.type === "pipeline_updated" ||
              data.type === "jobworks_updated" ||
              data.type === "machine_types_updated" ||
              data.type === "restok_updated" ||
              data.type === "roadmaps_updated"
            ) {
              callbackRef.current(data);
            }
          } catch (error) {
            console.error("Failed to parse SSE message:", error);
          }
        };

        eventSource.onerror = () => {
          console.log(
            `[SSE] Connection error on attempt ${connectAttemptsRef.current}, readyState:`,
            eventSource?.readyState,
          );
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }

          if (connectAttemptsRef.current >= 2) {
            console.log(
              "[SSE] Max retry attempts (2) reached, switching to polling permanently",
            );
            setupPollingFallback();
          } else {
            console.log("[SSE] Retrying connection in 2 seconds...");
            if (!reconnectTimeout) {
              reconnectTimeout = setTimeout(connect, 2000);
            }
          }
        };
      } catch (error) {
        console.error(
          `[SSE] Failed to establish connection on attempt ${connectAttemptsRef.current}:`,
          error,
        );

        if (connectAttemptsRef.current >= 2) {
          console.log(
            "[SSE] Max retry attempts (2) reached, switching to polling",
          );
          setupPollingFallback();
        } else {
          console.log("[SSE] Will retry in 2 seconds...");
          if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(connect, 2000);
          }
        }
      }
    }

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);
}
