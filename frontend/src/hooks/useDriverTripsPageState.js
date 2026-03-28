import usePageScrollProgress from './usePageScrollProgress';
import useDriverTripsState from './useDriverTripsState';

export default function useDriverTripsPageState() {
  const { isScrolled, scrollProgress } = usePageScrollProgress();
  const driverTripsState = useDriverTripsState();

  return {
    isScrolled,
    scrollProgress,
    ...driverTripsState,
  };
}
