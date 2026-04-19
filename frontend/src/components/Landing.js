import { Link } from 'react-router-dom';
import HeaderScrollProgress from './HeaderScrollProgress';
import { howItWorksSteps, landingSlides } from '../data/landingContent';
import useLandingPageState from '../hooks/useLandingPageState';
import './Landing.css';

export default function Landing() {
  const {
    isScrolled,
    scrollProgress,
    activeSlide,
    setActiveSlide,
    goToPreviousSlide,
    goToNextSlide,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    currentYear,
    currentSlide,
  } = useLandingPageState();

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

          <Link className="brand" to="/">
            <img alt="Bulk Buddy logo" className="brand-logo" src="/images/logo-main1.png" />
            <span>Bulk Buddy</span>
          </Link>

          <nav className="header-actions" aria-label="Primary">
            <Link className="header-link" to="/login">
              Log in
            </Link>
            <Link className="header-link header-link-primary" to="/register">
              Sign up
            </Link>
          </nav>
        </div>
        <HeaderScrollProgress scrollProgress={scrollProgress} />
      </header>

      <main
        className="landing-main"
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
      >
        {/* Translate the whole slide track instead of mounting/unmounting each slide. */}
        <div className="landing-main-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
          {landingSlides.map((slide) => (
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
          <span aria-hidden="true" className="carousel-arrow-icon carousel-arrow-icon-left">
            <svg fill="none" viewBox="0 0 12 8" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M1.25 1.5 6 6.25l4.75-4.75"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </span>
        </button>

        <button
          aria-label="Show next slide"
          className="carousel-arrow carousel-arrow-right"
          onClick={goToNextSlide}
          type="button"
        >
          <span aria-hidden="true" className="carousel-arrow-icon carousel-arrow-icon-right">
            <svg fill="none" viewBox="0 0 12 8" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M1.25 1.5 6 6.25l4.75-4.75"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </span>
        </button>

        <section className="landing-description">
          <p className="section-tag">{currentSlide.tag}</p>
          <h1>{currentSlide.title}</h1>
          <p className="landing-lede">{currentSlide.description}</p>
          <div className="landing-actions">
            <Link className="button button-primary" to={currentSlide.primaryHref}>
              {currentSlide.primaryLabel}
            </Link>
            <a className="button button-secondary" href={currentSlide.secondaryHref}>
              {currentSlide.secondaryLabel}
            </a>
          </div>
        </section>

        <div aria-label="Carousel navigation" className="landing-indicators" role="tablist">
          {landingSlides.map((slide, index) => (
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

      <section className="landing-final-cta" aria-label="Get started">
        <div className="landing-final-cta-inner">
          <h2>Ready to split your next warehouse run?</h2>
          <p>Join Bulk Buddy now or log back in to see active trips near you.</p>
          <div className="landing-final-cta-actions">
            <Link className="button button-primary" to="/register">
              Get Started
            </Link>
            <Link className="button button-secondary" to="/login">
              Log in
            </Link>
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
            <Link to="/login">Log in</Link>
            <Link to="/register">Sign up</Link>
            <a href="mailto:support@bulkbuddy.app">Contact</a>
          </nav>
        </div>

        <p className="landing-footer-meta">© {currentYear} Bulk Buddy. All rights reserved.</p>
      </footer>
    </div>
  );
}
