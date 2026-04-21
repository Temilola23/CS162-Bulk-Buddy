import usePageScrollProgress from './usePageScrollProgress';
import useDriverTripsState from './useDriverTripsState';

/**
 * Combines scroll progress with driver trip page state.
 */
export default function useDriverTripsPageState() {
  const { isScrolled, scrollProgress } = usePageScrollProgress();
  const driverTripsState = useDriverTripsState();

  return {
    isScrolled,
    scrollProgress,
    ...driverTripsState,
  };
}
