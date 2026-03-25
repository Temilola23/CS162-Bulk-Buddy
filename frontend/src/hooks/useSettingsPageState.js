import usePageScrollProgress from '../components/usePageScrollProgress';
import useSettingsForm from './useSettingsForm';

export default function useSettingsPageState() {
  const { isScrolled, scrollProgress } = usePageScrollProgress();
  const settingsState = useSettingsForm();

  return {
    isScrolled,
    scrollProgress,
    ...settingsState,
  };
}
