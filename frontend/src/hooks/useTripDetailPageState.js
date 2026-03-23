import usePageScrollProgress from '../components/usePageScrollProgress';
import useTripDetailState from './useTripDetailState';

export default function useTripDetailPageState() {
  const { isScrolled, scrollProgress } = usePageScrollProgress();
  const tripDetailState = useTripDetailState();

  return {
    isScrolled,
    scrollProgress,
    ...tripDetailState,
  };
}
