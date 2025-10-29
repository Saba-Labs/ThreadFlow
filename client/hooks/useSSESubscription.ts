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

  useEffect(() => {
    callbackRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let pollingInterval: NodeJS.Timeout | null = null;

    function setupPollingFallback() {
      console.log("[SSE Fallback] SSE not available, switching to polling every 2 seconds");
      sseFailedRef.current = true;

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
        eventSource = new EventSource("/api/subscribe");

        eventSource.onopen = () => {
          console.log("SSE connection established");
          sseFailedRef.current = false;
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
          console.log("[SSE] Connection error, readyState:", eventSource?.readyState);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }

          if (!sseFailedRef.current) {
            console.log("[SSE] Retrying connection in 3 seconds...");
            if (!reconnectTimeout) {
              reconnectTimeout = setTimeout(connect, 3000);
            }
          } else {
            console.log("[SSE] Already failed once, switching to polling");
            setupPollingFallback();
          }
        };
      } catch (error) {
        console.error("[SSE] Failed to establish connection:", error);
        if (!sseFailedRef.current) {
          console.log("[SSE] Will retry in 3 seconds...");
          if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(connect, 3000);
          }
        } else {
          setupPollingFallback();
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
