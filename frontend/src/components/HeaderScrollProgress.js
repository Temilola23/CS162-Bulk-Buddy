import './HeaderScrollProgress.css';

/**
 * Shows the moving car progress indicator tied to page scroll position.
 */
export default function HeaderScrollProgress({ scrollProgress }) {
  const progressFillStyle = { width: `${scrollProgress}%` };
  const carStyle = { left: `${Math.min(98, Math.max(2, scrollProgress))}%` };

  return (
    <div aria-hidden="true" className="header-scroll-progress">
      <div className="header-scroll-progress-inner">
        <div className="header-scroll-progress-track">
          <div className="header-scroll-progress-fill" style={progressFillStyle} />
          <span className="header-scroll-progress-car" style={carStyle}>
            <svg
              aria-hidden="true"
              className="header-scroll-car-icon"
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
  );
}
