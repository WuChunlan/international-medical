import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import type { AuthState } from '../store/authStore';
import api from '../api';
import './Header.less';

const NAV_LINKS = {
  zh: [
    { label: '首页', anchor: '#hero' },
    { label: '中国顶尖医院', anchor: '#hospitals' },
    { label: '先进医疗设备', anchor: '#equipment' },
    { label: '专业服务团队', anchor: '#service-teams' },
    { label: '过往成功案例', anchor: '#cases' },
    { label: '特需治疗', anchor: '#products' },
  ],
  en: [
    { label: 'Home', anchor: '#hero' },
    { label: 'Top Hospitals', anchor: '#hospitals' },
    { label: 'Advanced Equipment', anchor: '#equipment' },
    { label: 'Service Teams', anchor: '#service-teams' },
    { label: 'Success Cases', anchor: '#cases' },
    { label: 'Special Care', anchor: '#products' },
  ],
};

const LANGUAGES = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
];

export default function Header() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s: AuthState) => s.user);
  const logout = useAuthStore((s: AuthState) => s.logout);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState('#hero');
  const [siteName, setSiteName] = useState('国际医疗');
  const [siteSubtitle, setSiteSubtitle] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const isZh = i18n.language.startsWith('zh');
    const pick = (cfg: { valueZh?: string; valueEn?: string } | null, fallbackZh: string, fallbackEn: string) =>
      isZh ? cfg?.valueZh || fallbackZh : cfg?.valueEn || fallbackEn;

    const fetchConfig = (key: string) =>
      api.get(`/api/config/${key}`).then((r) => r.data).catch(() => null);

    Promise.all([
      fetchConfig('site_name'),
      fetchConfig('site_subtitle'),
      fetchConfig('site_logo_url'),
    ]).then(([name, subtitle, logo]) => {
      setSiteName(pick(name, '国际医疗国际医疗共享平台', 'International Medical'));
      setSiteSubtitle(pick(subtitle, '', ''));
      setLogoUrl(logo?.valueZh || logo?.valueEn || '');
    });
  }, [i18n.language]);

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
    const id = anchor.replace('#', '');
    window.dispatchEvent(new CustomEvent('nav:switch-tab', { detail: { tab: 'professional', anchor: id } }));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={`site-a-header${scrolled ? ' site-a-header--scrolled' : ''}`}>
      {/* Row 1: topbar */}
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
          <div className="site-a-header__auth-links">
            {user ? (
              <>
                <Link to="/profile" className="header-auth-link">{user.username}</Link>
                <button className="header-auth-link header-auth-link--btn" onClick={handleLogout}>
                  {lang === 'zh' ? '退出' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="header-auth-link">
                  {lang === 'zh' ? '登录' : 'Login'}
                </Link>
                <Link to="/register" className="header-auth-link header-auth-link--register">
                  {lang === 'zh' ? '注册' : 'Register'}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: logo + nav */}
      <div className="site-a-header__main">
        <div className="site-a-header__inner">
          <div className="site-a-header__logo" onClick={() => scrollTo('#hero')}>
            {logoUrl && (
              <img src={logoUrl} alt={siteName} className="site-a-header__logo-img" />
            )}
            <div className="site-a-header__logo-info">
              <span className="site-a-header__logo-text">{siteName}</span>
              {siteSubtitle && (
                <span className="site-a-header__logo-subtitle">{siteSubtitle}</span>
              )}
            </div>
          </div>

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
          <div className="site-a-header__mobile-auth">
            {user ? (
              <>
                <Link to="/profile" className="header-auth-link" onClick={() => setMobileOpen(false)}>{user.username}</Link>
                <button className="header-auth-link header-auth-link--btn" onClick={() => { handleLogout(); setMobileOpen(false); }}>
                  {lang === 'zh' ? '退出' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="header-auth-link" onClick={() => setMobileOpen(false)}>
                  {lang === 'zh' ? '登录' : 'Login'}
                </Link>
                <Link to="/register" className="header-auth-link header-auth-link--register" onClick={() => setMobileOpen(false)}>
                  {lang === 'zh' ? '注册' : 'Register'}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
