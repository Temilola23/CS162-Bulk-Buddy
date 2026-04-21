import { useEffect, useRef, useState } from 'react';

/**
 * Manages landing-page slide navigation, wheel gestures, and touch swipes.
 */
export default function useLandingCarousel(slideCount) {
  const [activeSlide, setActiveSlide] = useState(0);
  const swipeStart = useRef(null);
  const swipeCurrent = useRef(null);

  useEffect(() => {
    if (slideCount <= 1) {
      return undefined;
    }

    // Auto-advance keeps the hero moving even if the user does not interact.
    const slideTimer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % slideCount);
    }, 6000);

    return () => clearInterval(slideTimer);
  }, [slideCount]);

  function goToPreviousSlide() {
    if (slideCount <= 1) {
      return;
    }

    setActiveSlide((current) => (current - 1 + slideCount) % slideCount);
  }

  function goToNextSlide() {
    if (slideCount <= 1) {
      return;
    }

    setActiveSlide((current) => (current + 1) % slideCount);
  }

  function handleTouchStart(event) {
    const touch = event.touches[0];
    swipeStart.current = { x: touch.clientX, y: touch.clientY };
    swipeCurrent.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchMove(event) {
    if (!swipeStart.current) {
      return;
    }

    const touch = event.touches[0];
    swipeCurrent.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd() {
    if (!swipeStart.current || !swipeCurrent.current) {
      swipeStart.current = null;
      swipeCurrent.current = null;
      return;
    }

    const deltaX = swipeStart.current.x - swipeCurrent.current.x;
    const deltaY = swipeStart.current.y - swipeCurrent.current.y;
    const swipeThreshold = 45;

    // Only treat the gesture as a slide change when the movement is mostly horizontal.
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0) {
        goToNextSlide();
      } else {
        goToPreviousSlide();
      }
    }

    swipeStart.current = null;
    swipeCurrent.current = null;
  }

  return {
    activeSlide,
    setActiveSlide,
    goToPreviousSlide,
    goToNextSlide,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
