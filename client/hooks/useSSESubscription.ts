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

  useEffect(() => {
    callbackRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    function connect() {
      try {
        eventSource = new EventSource("/api/subscribe");

        eventSource.onopen = () => {
          console.log("SSE connection established");
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
          }
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (
              data.type === "pipeline_updated" ||
              data.type === "jobworks_updated" ||
              data.type === "machine_types_updated" ||
              data.type === "restok_updated"
            ) {
              callbackRef.current(data);
            }
          } catch (error) {
            console.error("Failed to parse SSE message:", error);
          }
        };

        eventSource.onerror = () => {
          console.log("SSE connection error, attempting to reconnect...");
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };
      } catch (error) {
        console.error("Failed to establish SSE connection:", error);
        if (!reconnectTimeout) {
          reconnectTimeout = setTimeout(connect, 3000);
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
    };
  }, []);
}
