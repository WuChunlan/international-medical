import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import scotempLogo from '../assets/scotemp_logo.png';
import './Header.less';

const NAV_LINKS = {
  zh: [
    { label: '首页', anchor: '#hero' },
    { label: '顶尖医院', anchor: '#hospitals' },
    { label: '医疗设备', anchor: '#equipment' },
    { label: '成功案例', anchor: '#cases' },
    { label: '特需治疗', anchor: '#products' },
  ],
  en: [
    { label: 'Home', anchor: '#hero' },
    { label: 'Hospitals', anchor: '#hospitals' },
    { label: 'Equipment', anchor: '#equipment' },
    { label: 'Cases', anchor: '#cases' },
    { label: 'Special Care', anchor: '#products' },
  ],
};

const LANGUAGES = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
];

export default function Header() {
  const { i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState('#hero');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const lang = i18n.language === 'zh' ? 'zh' : 'en';
  const navLinks = NAV_LINKS[lang];

  const scrollTo = (anchor: string) => {
    setMobileOpen(false);
    setActiveAnchor(anchor);
    if (anchor === '#hero') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (anchor === '#products') {
      window.dispatchEvent(new CustomEvent('nav:switch-tab', { detail: { tab: 'special', anchor: 'products' } }));
      return;
    }
    // hospitals / equipment / cases — ensure professional tab is active first
    const id = anchor.replace('#', '');
    window.dispatchEvent(new CustomEvent('nav:switch-tab', { detail: { tab: 'professional', anchor: id } }));
  };

  return (
    <header className={`site-a-header${scrolled ? ' site-a-header--scrolled' : ''}`}>
      {/* ── Row 1: topbar — lang switcher LEFT (matches scotemp jz_col_5) ── */}
      <div className="site-a-header__topbar">
        <div className="site-a-header__topbar-inner">
          <div className="site-a-header__lang-switcher">
            {LANGUAGES.map(lng => (
              <button
                key={lng.code}
                className={`header-lang-item${i18n.language === lng.code ? ' header-lang-item--active' : ''}`}
                onClick={() => i18n.changeLanguage(lng.code)}
              >
                {lng.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: logo + nav ── */}
      <div className="site-a-header__main">
        <div className="site-a-header__inner">
          {/* Logo */}
          <div className="site-a-header__logo" onClick={() => scrollTo('#hero')}>
            <img src={scotempLogo} alt="SCO International Medical" className="site-a-header__logo-img" />
          </div>

          {/* Desktop nav */}
          <nav className="site-a-header__nav">
            {navLinks.map(link => (
              <button
                key={link.anchor}
                className={`header-nav-link${activeAnchor === link.anchor ? ' header-nav-link--active' : ''}`}
                onClick={() => scrollTo(link.anchor)}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="site-a-header__mobile-btn"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              {mobileOpen
                ? <path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                : <path d="M3 6h18M3 12h18M3 18h18" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="site-a-header__mobile-menu">
          {navLinks.map(link => (
            <button
              key={link.anchor}
              className="header-nav-link header-nav-link--mobile"
              onClick={() => scrollTo(link.anchor)}
            >
              {link.label}
            </button>
          ))}
          <div className="site-a-header__mobile-lang">
            {LANGUAGES.map(lng => (
              <button
                key={lng.code}
                className={`header-lang-item${i18n.language === lng.code ? ' header-lang-item--active' : ''}`}
                onClick={() => { i18n.changeLanguage(lng.code); setMobileOpen(false); }}
              >
                {lng.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
