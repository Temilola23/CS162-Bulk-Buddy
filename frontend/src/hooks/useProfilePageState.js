import usePageScrollProgress from './usePageScrollProgress';
import useDriverApplicationForm from './useDriverApplicationForm';

/**
 * Combines scroll progress with profile and driver application state.
 */
export default function useProfilePageState() {
  const { isScrolled, scrollProgress } = usePageScrollProgress();
  const applicationState = useDriverApplicationForm();

  return {
    isScrolled,
    scrollProgress,
    ...applicationState,
  };
}
