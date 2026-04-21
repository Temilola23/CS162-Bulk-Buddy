import usePageScrollProgress from './usePageScrollProgress';
import useSettingsForm from './useSettingsForm';

/**
 * Combines scroll progress with settings form state.
 */
export default function useSettingsPageState() {
  const { isScrolled, scrollProgress } = usePageScrollProgress();
  const settingsState = useSettingsForm();

  return {
    isScrolled,
    scrollProgress,
    ...settingsState,
  };
}
