import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "./use-mobile";

const MIN_SWIPE_DISTANCE = 150;

interface SwipeNavigationConfig {
  leftPage: string;
  rightPage: string;
  disabled?: boolean;
}

export function useSwipeNavigation(config: SwipeNavigationConfig) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!isMobile || config.disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0]?.clientX ?? null;
      touchStartY.current = e.touches[0]?.clientY ?? null;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (
        touchStartX.current === null ||
        touchStartY.current === null ||
        e.changedTouches.length === 0
      ) {
        return;
      }

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;

      // Only consider swipe if horizontal movement is greater than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE) {
          // Swipe right (positive deltaX)
          if (deltaX > 0) {
            navigate(config.rightPage);
          }
          // Swipe left (negative deltaX)
          else {
            navigate(config.leftPage);
          }
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile, navigate, config.leftPage, config.rightPage, config.disabled]);
}
