import { useTranslation } from 'react-i18next';
import './Footer.less';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="site-footer">
      <div className="section-container">
        <div className="site-footer__top">
          {/* Logo */}
          <div className="site-footer__logo">
            <div className="site-footer__logo-emblem">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="var(--gold)"/>
              </svg>
            </div>
            <div>
              <div className="site-footer__logo-name">国际医疗</div>
              <div className="site-footer__logo-sub">International Medical</div>
            </div>
          </div>

          <p className="site-footer__tagline">{t('footer.tagline')}</p>

          {/* Ornament */}
          <div className="site-footer__ornament">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`site-footer__ornament-dot${i === 2 ? ' site-footer__ornament-dot--large' : ' site-footer__ornament-dot--small'}`}
              />
            ))}
          </div>
        </div>

        <div className="site-footer__bottom">
          <p className="site-footer__copyright">{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
