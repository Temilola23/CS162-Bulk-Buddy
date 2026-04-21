import usePageScrollProgress from './usePageScrollProgress';
import useTripDetailState from './useTripDetailState';

/**
 * Combines scroll progress with trip detail order state.
 */
export default function useTripDetailPageState() {
  const { isScrolled, scrollProgress } = usePageScrollProgress();
  const tripDetailState = useTripDetailState();

  return {
    isScrolled,
    scrollProgress,
    ...tripDetailState,
  };
}
