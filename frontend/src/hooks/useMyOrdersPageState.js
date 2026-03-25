import usePageScrollProgress from '../components/usePageScrollProgress';
import useMyOrdersState from './useMyOrdersState';

export default function useMyOrdersPageState() {
  const { isScrolled, scrollProgress } = usePageScrollProgress();
  const myOrdersState = useMyOrdersState();

  return {
    isScrolled,
    scrollProgress,
    ...myOrdersState,
  };
}
