import { NavLink } from 'react-router-dom';

/** Shared across both routes — this reads as one product, not two sites. */
export function SiteHeader() {
  return (
    <header className="hdr">
      <div className="hdr__inner">
        <NavLink to="/" className="hdr__brand" aria-label="Yizzy home">
          <Mark />
          <span className="hdr__word">Yizzy</span>
        </NavLink>
        <nav className="hdr__nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `hdr__link ${isActive ? 'is-active' : ''}`}
          >
            Home
          </NavLink>
          <NavLink
            to="/infra-map"
            className={({ isActive }) => `hdr__link ${isActive ? 'is-active' : ''}`}
          >
            Charging Infra Map
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

function Mark() {
  return (
    <svg viewBox="0 0 28 28" width="26" height="26" aria-hidden="true">
      <rect x="1" y="1" width="26" height="26" rx="7" fill="#FFC246" />
      <path d="M15.6 6 L9 15.6 H13.4 L12.4 22 L19 12.4 H14.6 Z" fill="#181A20" />
    </svg>
  );
}
