import usePageScrollProgress from './usePageScrollProgress';
import useTripFeedState from './useTripFeedState';

/**
 * Combines scroll progress with trip feed state and cart actions.
 */
export default function useTripFeedPageState() {
  // Keep the page component focused on rendering by composing scroll UI state
  // with the trip-feed workflow state here.
  const { isScrolled, scrollProgress } = usePageScrollProgress();
  const tripFeedState = useTripFeedState();

  return {
    isScrolled,
    scrollProgress,
    ...tripFeedState,
  };
}
