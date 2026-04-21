import usePageScrollProgress from './usePageScrollProgress';
import useItemFeedState from './useItemFeedState';

/**
 * Combines scroll progress with item feed data and actions.
 */
export default function useItemFeedPageState() {
  const { isScrolled, scrollProgress } = usePageScrollProgress();
  const itemFeedState = useItemFeedState();

  return {
    isScrolled,
    scrollProgress,
    ...itemFeedState,
  };
}
