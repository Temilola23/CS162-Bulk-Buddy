import { useEffect, useRef, useState } from 'react';
import './Landing.css';

const slides = [
  {
    image: '/images/carousel1.jpg',
    imageAlt: 'Friends sharing a grocery run plan',
    tag: 'For shoppers without cars',
    title: 'Split bulk groceries. Save more together.',
    description:
      "Connect with drivers already heading to Costco or Sam's Club, claim only what you need, and meet at a nearby pickup point that actually works for your week.",
    primaryLabel: 'Get Started',
    primaryHref: '/register',
    secondaryLabel: 'How it works',
    secondaryHref: '#how-it-works',
  },
  {
    image: '/images/carousel2.jpg',
    imageAlt: 'Rows of groceries inside a warehouse store',
    tag: 'Plan smarter grocery hauls',
    title: 'Browse shareable warehouse items before checkout.',
    description:
      'See what is being purchased, claim only your portion, and avoid overbuying giant packs that do not fit your week or budget.',
    primaryLabel: 'Browse Nearby Trips',
    primaryHref: '/trip-feed',
    secondaryLabel: 'See claim flow',
    secondaryHref: '#how-it-works',
  },
  {
    image: '/images/carousel3.jpg',
    imageAlt: 'People collecting grocery orders at pickup',
    tag: 'Fast and clear pickup',
    title: 'Meet once, collect quickly, and head home.',
    description:
      'Track claim status updates and pickup windows so everyone knows exactly when orders are ready and where to meet.',
    primaryLabel: 'Start Claiming Shares',
    primaryHref: '/register',
    secondaryLabel: 'Review pickup steps',
    secondaryHref: '#how-it-works',
  },
];

const howItWorksSteps = [
  {
    title: "Drivers post store trips",
    description:
      'Verified drivers publish trip time, pickup location, and item shares so nearby shoppers can join.',
  },
  {
    title: 'Shoppers claim portions of bulk items',
    description:
      'Choose from the driver’s listed items, claim only what you need, and is available.',
  },
  {
    title: 'Meet at pickup location and pay your share',
    description:
      'Track claim status updates, then collect your groceries at the agreed spot and settle your portion.',
  },
];

// const faqItems = [
//   {
//     question: 'How do payments work?',
//     answer:
//       'In V1, shoppers and drivers coordinate payment directly at pickup. You can still see claim status updates before meeting.',
//   },
//   {
//     question: 'Can I request items not listed in the trip?',
//     answer:
//       'No. Shoppers can claim only from the driver’s predefined item list so quantities stay clear and overselling is prevented.',
//   },
//   {
//     question: 'What if I miss the pickup window?',
//     answer:
//       'Use trip notes and status updates to coordinate quickly with the driver. Pickup details remain visible in your orders view.',
//   },
// ];

export default function Landing() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const currentYear = new Date().getFullYear();
  const swipeStart = useRef(null);
  const swipeCurrent = useRef(null);

  useEffect(() => {
    // Auto-advance the hero so the landing page continues to feel active.
    const slideTimer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 6000);

    return () => clearInterval(slideTimer);
  }, []);

  useEffect(() => {
    function handleScroll() {
      // Reuse the same scroll value for both the glossy header state and the progress bar.
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

      setIsScrolled(scrollTop > 0);
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentSlide = slides[activeSlide];

  function goToPreviousSlide() {
    setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  }

  function goToNextSlide() {
    setActiveSlide((current) => (current + 1) % slides.length);
  }

  function handleTouchStart(event) {
    const touch = event.touches[0];
    swipeStart.current = { x: touch.clientX, y: touch.clientY };
    swipeCurrent.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchMove(event) {
    if (!swipeStart.current) {
      return;
    }

    const touch = event.touches[0];
    swipeCurrent.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd() {
    if (!swipeStart.current || !swipeCurrent.current) {
      swipeStart.current = null;
      swipeCurrent.current = null;
      return;
    }

    const deltaX = swipeStart.current.x - swipeCurrent.current.x;
    const deltaY = swipeStart.current.y - swipeCurrent.current.y;
    const swipeThreshold = 45;

    // Only treat the gesture as a slide change when the movement is mostly horizontal.
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0) {
        goToNextSlide();
      } else {
        goToPreviousSlide();
      }
    }

    swipeStart.current = null;
    swipeCurrent.current = null;
  }

  const progressFillStyle = { width: `${scrollProgress}%` };
  const carStyle = { left: `${Math.min(98, Math.max(2, scrollProgress))}%` };

  return (
    <div className="landing">
      <header className={`landing-header ${isScrolled ? 'is-scrolled' : ''}`.trim()}>
        <div className="landing-header-inner">
          <nav className="header-info-links" aria-label="Company">
            <a className="header-info-link" href="#about-us">
              About us
            </a>
            <a className="header-info-link" href="#contact">
              Contact
            </a>
          </nav>

          <a className="brand" href="/">
            <img alt="Bulk Buddy logo" className="brand-logo" src="/images/logo-main1.png" />
            <span>Bulk Buddy</span>
          </a>

          <nav className="header-actions" aria-label="Primary">
            <a className="header-link" href="/login">
              Log in
            </a>
            <a className="header-link header-link-primary" href="/register">
              Sign up
            </a>
          </nav>
        </div>
        <div aria-hidden="true" className="landing-scroll-progress">
          <div className="landing-scroll-progress-inner">
            <div className="landing-scroll-progress-track">
              <div className="landing-scroll-progress-fill" style={progressFillStyle} />
              <span className="landing-scroll-progress-car" style={carStyle}>
                <svg
                  aria-hidden="true"
                  className="landing-scroll-car-icon"
                  fill="none"
                  viewBox="0 0 64 32"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 20h4l4-8h24l6 8h6a4 4 0 0 1 4 4v2H4v-2a4 4 0 0 1 4-4Z"
                    fill="#4d216a"
                  />
                  <circle cx="18" cy="26" fill="#2b0f3d" r="4" />
                  <circle cx="44" cy="26" fill="#2b0f3d" r="4" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main
        className="landing-main"
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
      >
        <div className="landing-main-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
          {slides.map((slide) => (
            <article
              aria-label={slide.imageAlt}
              className="landing-slide"
              key={slide.image}
              role="img"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          ))}
        </div>
        <div aria-hidden="true" className="landing-main-overlay" />

        <button
          aria-label="Show previous slide"
          className="carousel-arrow carousel-arrow-left"
          onClick={goToPreviousSlide}
          type="button"
        >
          <img alt="" aria-hidden="true" className="carousel-arrow-icon" src="/images/left-arrow.png" />
        </button>

        <button
          aria-label="Show next slide"
          className="carousel-arrow carousel-arrow-right"
          onClick={goToNextSlide}
          type="button"
        >
          <img
            alt=""
            aria-hidden="true"
            className="carousel-arrow-icon carousel-arrow-icon-right"
            src="/images/left-arrow.png"
          />
        </button>

        <section className="landing-description">
          <p className="section-tag">{currentSlide.tag}</p>
          <h1>{currentSlide.title}</h1>
          <p className="landing-lede">{currentSlide.description}</p>
          <div className="landing-actions">
            <a className="button button-primary" href={currentSlide.primaryHref}>
              {currentSlide.primaryLabel}
            </a>
            <a className="button button-secondary" href={currentSlide.secondaryHref}>
              {currentSlide.secondaryLabel}
            </a>
          </div>
        </section>

        <div aria-label="Carousel navigation" className="landing-indicators" role="tablist">
          {slides.map((slide, index) => (
            <button
              aria-label={`Show slide ${index + 1}`}
              aria-selected={activeSlide === index}
              className={`indicator-dot ${activeSlide === index ? 'is-active' : ''}`}
              key={slide.image}
              onClick={() => setActiveSlide(index)}
              role="tab"
              type="button"
            />
          ))}
        </div>
      </main>

      <section className="how-it-works-section" id="how-it-works">
        <div className="how-it-works-inner">
          <header className="how-it-works-heading">
            <p className="how-it-works-kicker">How it works</p>
            <h2>Three steps from warehouse run to pickup.</h2>
            <p>
              Bulk Buddy keeps the flow simple so shoppers without cars can join shared grocery
              trips confidently.
            </p>
          </header>

          <div className="how-it-works-grid">
            {howItWorksSteps.map((step, index) => (
              <article className="how-it-works-card" key={step.title}>
                <span className="how-it-works-index">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* <section className="landing-faq-section" id="faq">
        <div className="landing-faq-inner">
          <header className="landing-faq-heading">
            <p className="how-it-works-kicker">FAQ</p>
            <h2>Common questions before your first trip.</h2>
          </header>

          <div className="landing-faq-list">
            {faqItems.map((item) => (
              <details className="landing-faq-item" key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section> */}

      <section className="landing-final-cta" aria-label="Get started">
        <div className="landing-final-cta-inner">
          <h2>Ready to split your next warehouse run?</h2>
          <p>Join Bulk Buddy now or log back in to see active trips near you.</p>
          <div className="landing-final-cta-actions">
            <a className="button button-primary" href="/register">
              Get Started
            </a>
            <a className="button button-secondary" href="/login">
              Log in
            </a>
          </div>
        </div>
      </section>

      <footer className="landing-footer" id="contact">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand" id="about-us">
            <h3>Bulk Buddy</h3>
            <p>
              Share warehouse-sized grocery trips with nearby drivers, split only what you need,
              and pick up at a location that works for your schedule.
            </p>
          </div>

          <nav aria-label="Footer" className="landing-footer-links">
            <a href="#about-us">About Us</a>
            <a href="/login">Log in</a>
            <a href="/register">Sign up</a>
            <a href="mailto:support@bulkbuddy.app">Contact</a>
          </nav>
        </div>

        <p className="landing-footer-meta">© {currentYear} Bulk Buddy. All rights reserved.</p>
      </footer>
    </div>
  );
}
