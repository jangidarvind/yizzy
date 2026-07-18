import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="ftr">
      <div className="wrap ftr__inner">
        <div className="ftr__brandcol">
          <span className="ftr__word">Yizzy</span>
          <p className="ftr__mission">
            Getting India's gig drivers from renting a fuel vehicle to owning an EV —
            and keeping them earning on it for the life of the vehicle.
          </p>
        </div>

        <div className="ftr__col">
          <h4>Product</h4>
          <Link to="/">Home</Link>
          <Link to="/infra-map">Charging Infra Map</Link>
          <a href="#calculator">Earnings calculator</a>
        </div>

        <div className="ftr__col">
          <h4>Contact</h4>
          <a href="mailto:hello@yizzy.in">hello@yizzy.in</a>
          <span className="ftr__muted">Hyderabad, India</span>
        </div>
      </div>

      <div className="wrap ftr__base">
        <span>© {new Date().getFullYear()} Yizzy</span>
        <span className="ftr__muted">
          Figures on this page are illustrative estimates, not loan offers.
        </span>
      </div>
    </footer>
  );
}
