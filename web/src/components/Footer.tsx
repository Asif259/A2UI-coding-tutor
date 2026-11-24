import { Logo } from "./Icons";
import { useReveal } from "../motion";

export default function Footer({ onProviders }: { onProviders: () => void }) {
  const ref = useReveal<HTMLElement>();
  return (
    <footer className="footer on-dark" ref={ref}>
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <a href="#top" aria-label="A2UI Tutor, back to top">
              <Logo />
            </a>
            <p className="body-sm">
              An interactive coding tutor on A2UI v1.0. Built as a personal exploration of agent-drawn surfaces — no
              accounts, local first.
            </p>
          </div>
          <div className="footer__col">
            <h3 className="label-lg">Sections</h3>
            <ul className="body-sm">
              <li>
                <a href="#session">Session</a>
              </li>
              <li>
                <a href="#how">How a reply is built</a>
              </li>
              <li>
                <a href="#questions">Questions</a>
              </li>
            </ul>
          </div>
          <div className="footer__col">
            <h3 className="label-lg">Setup</h3>
            <ul className="body-sm">
              <li>
                <button type="button" className="u-link" onClick={onProviders}>
                  Add a provider
                </button>
              </li>
              <li>
                <a href="#questions">Offline mode</a>
              </li>
              <li>
                <a href="/LICENSE.txt">MIT license</a>
              </li>
            </ul>
          </div>
          <div className="footer__col">
            <h3 className="label-lg">Assets</h3>
            <ul className="body-sm">
              <li>
                <a href="/credits.html">Photo credits</a>
              </li>
              <li>
                <a href="/404.html">Not found page</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <span className="label-lg">A2UI Tutor · a local exploration</span>
          <div className="footer__legal label-lg">
            <span>Photography not yet supplied</span>
            <a href="/credits.html">Photo credits</a>
            <span>© 2026</span>
          </div>
        </div>
        <div className="footer__wordmark" aria-hidden="true">
          <svg viewBox="0 0 980 150" fill="none">
            <text x="0" y="120" fill="currentColor" fontFamily="Geist, sans-serif" fontWeight="500" fontSize="140" letterSpacing="-4">
              A2UI TUTOR
            </text>
          </svg>
        </div>
      </div>
    </footer>
  );
}
