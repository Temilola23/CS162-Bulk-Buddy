import usePageScrollProgress from './usePageScrollProgress';
import useItemFeedState from './useItemFeedState';

export default function useItemFeedPageState() {
  const { isScrolled, scrollProgress } = usePageScrollProgress();
  const itemFeedState = useItemFeedState();

  return {
    isScrolled,
    scrollProgress,
    ...itemFeedState,
  };
}
