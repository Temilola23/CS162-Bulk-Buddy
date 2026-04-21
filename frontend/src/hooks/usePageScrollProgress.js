import { useEffect, useState } from 'react';

/**
 * Tracks whether the page is scrolled and computes scroll progress percent.
 */
export default function usePageScrollProgress() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      // Fall back across the different browser scroll properties so the hook
      // stays resilient even if the page is mounted in a different environment.
      const scrollTop =
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
      );
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const maxScrollable = Math.max(0, documentHeight - viewportHeight);
      const progress = maxScrollable > 0 ? (scrollTop / maxScrollable) * 100 : 0;

      // The header only needs a binary scrolled state plus a clamped 0-100 bar.
      setIsScrolled(scrollTop > 0);
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { isScrolled, scrollProgress };
}
