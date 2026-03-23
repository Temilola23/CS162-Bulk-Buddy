import usePageScrollProgress from '../components/usePageScrollProgress';
import useDriverApplicationForm from './useDriverApplicationForm';

export default function useProfilePageState() {
  const { isScrolled, scrollProgress } = usePageScrollProgress();
  const applicationState = useDriverApplicationForm();

  return {
    isScrolled,
    scrollProgress,
    ...applicationState,
  };
}
