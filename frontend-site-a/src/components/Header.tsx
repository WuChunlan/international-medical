import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import type { AuthState } from '../store/authStore';
import api from '../api';
import './Header.less';

const NAV_LINKS = {
  zh: [
    { label: '首页', anchor: '#hero' },
    { label: '中国顶尖医院', anchor: '#hospitals' },
    { label: '高端医疗设备', anchor: '#equipment' },
    { label: '专业医护人员', anchor: '#doctors' },
    { label: '省心品质服务', anchor: '#service-features' },
    { label: '过往成功案例', anchor: '#cases' },
    { label: '特需治疗', anchor: '#products' },
  ],
  en: [
    { label: 'Home', anchor: '#hero' },
    { label: 'Top Hospitals', anchor: '#hospitals' },
    { label: 'Premium Equipment', anchor: '#equipment' },
    { label: 'Medical Staff', anchor: '#doctors' },
    { label: 'Quality Services', anchor: '#service-features' },
    { label: 'Success Cases', anchor: '#cases' },
    { label: 'Special Care', anchor: '#products' },
  ],
};

const HD_NAV_LINKS = {
  zh: [
    { label: '医院简介', anchor: '#hd-intro' },
    { label: '高端医疗设备', anchor: '#hd-equipment' },
    { label: '舒适诊疗环境', anchor: '#hd-environment' },
    { label: '专业医护团队', anchor: '#hd-doctors' },
  ],
  en: [
    { label: 'Hospital Overview', anchor: '#hd-intro' },
    { label: 'Premium Equipment', anchor: '#hd-equipment' },
    { label: 'Treatment Environment', anchor: '#hd-environment' },
    { label: 'Medical Team', anchor: '#hd-doctors' },
  ],
};

const PD_NAV_LINKS = {
  zh: [
    { label: '产品简介', anchor: '#pd-intro' },
    { label: '产品详情', anchor: '#pd-detail' },
    { label: '套餐选择', anchor: '#pd-variants' },
  ],
  en: [
    { label: 'Overview', anchor: '#pd-intro' },
    { label: 'Details', anchor: '#pd-detail' },
    { label: 'Packages', anchor: '#pd-variants' },
  ],
};

const LANGUAGES = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
];

export default function Header() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s: AuthState) => s.user);
  const logout = useAuthStore((s: AuthState) => s.logout);

  const isHospitalDetail = location.pathname.startsWith('/hospital/');
  const isProductDetail  = location.pathname.startsWith('/product/');
  const lang = i18n.language === 'zh' ? 'zh' : 'en';
  const navLinks = isHospitalDetail
    ? HD_NAV_LINKS[lang]
    : isProductDetail
      ? PD_NAV_LINKS[lang]
      : NAV_LINKS[lang];

  const defaultAnchor = isHospitalDetail ? '#hd-intro' : isProductDetail ? '#pd-intro' : '#hero';

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState(defaultAnchor);
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

  const scrollTo = (anchor: string) => {
    setMobileOpen(false);
    setActiveAnchor(anchor);
    if (isHospitalDetail || isProductDetail) {
      const id = anchor.replace('#', '');
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
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
          <div className="site-a-header__logo" onClick={() => (isHospitalDetail || isProductDetail) ? navigate('/') : scrollTo('#hero')}>
            {logoUrl && (
              <img src={logoUrl} alt={siteName} className="site-a-header__logo-img" />
            )}
            <div className="site-a-header__logo-info">
              <span className="site-a-header__logo-text">{siteName}</span>
              {siteSubtitle && (
                <span className="site-a-header__logo-text">{siteSubtitle}</span>
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
