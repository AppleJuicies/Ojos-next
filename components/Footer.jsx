import Link from 'next/link';
import '@/styles/Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="footer__wordmark">OJOs</span>
          <span className="footer__tagline">see eye to eye</span>
        </div>

        <div className="footer__links">
          <div className="footer__group">
            <span className="footer__group-title">Product</span>
            <Link href="/#how"    className="footer__link">How it works</Link>
            <Link href="/#what"   className="footer__link">What you get</Link>
            <Link href="/browse"  className="footer__link">Browse</Link>
          </div>

          <div className="footer__group">
            <span className="footer__group-title">Legal</span>
            <Link href="/privacy" className="footer__link">Privacy Policy</Link>
            <Link href="/terms"   className="footer__link">Terms of Service</Link>
          </div>

          <div className="footer__group">
            <span className="footer__group-title">Contact</span>
            <a href="mailto:hello@ojos.life" className="footer__contact-email">hello@ojos.life</a>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <span className="footer__copy">&copy; {year} OJOs. All rights reserved.</span>
      </div>
    </footer>
  );
}
