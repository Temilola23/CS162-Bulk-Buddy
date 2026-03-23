import usePageScrollProgress from '../components/usePageScrollProgress';
import { landingSlides } from '../data/landingContent';
import useLandingCarousel from './useLandingCarousel';

export default function useLandingPageState() {
  const { isScrolled, scrollProgress } = usePageScrollProgress();
  const carousel = useLandingCarousel(landingSlides.length);
  const currentYear = new Date().getFullYear();
  const currentSlide = landingSlides[carousel.activeSlide];

  return {
    isScrolled,
    scrollProgress,
    landingSlides,
    currentYear,
    currentSlide,
    ...carousel,
  };
}
