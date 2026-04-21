import usePageScrollProgress from './usePageScrollProgress';
import useMyOrdersState from './useMyOrdersState';

/**
 * Combines scroll progress with My Orders page state.
 */
export default function useMyOrdersPageState() {
  const { isScrolled, scrollProgress } = usePageScrollProgress();
  const myOrdersState = useMyOrdersState();

  return {
    isScrolled,
    scrollProgress,
    ...myOrdersState,
  };
}
