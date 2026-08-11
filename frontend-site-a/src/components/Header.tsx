import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import type { AuthState } from '../store/authStore';
import api from '../api';
import { loadLang } from '../i18n';
import './Header.less';

// zh/en nav labels are handled by i18n; 3rd-language labels fetched from /api/i18n/{lang}
const NAV_ANCHORS = ['#hero', '#hospitals', '#equipment', '#doctors', '#service-features', '#cases', '#products'];
const HD_NAV_ANCHORS = ['#hd-intro', '#hd-equipment', '#hd-environment', '#hd-doctors'];
const PD_NAV_ANCHORS = ['#pd-intro', '#pd-detail', '#pd-variants'];

// i18n keys for each nav anchor
const NAV_KEYS = ['nav.home', 'nav.hospitals', 'nav.equipment', 'nav.doctors', 'nav.service_features', 'nav.cases', 'nav.products'];
const HD_NAV_KEYS = ['nav.hd_intro', 'nav.hd_equipment', 'nav.hd_environment', 'nav.hd_doctors'];
const PD_NAV_KEYS = ['nav.pd_intro', 'nav.pd_detail', 'nav.pd_variants'];

const LANG_LABELS: Record<string, string> = {
  zh: '中文', en: 'English',
  ru: 'Русский', es: 'Español', fr: 'Français',
  de: 'Deutsch', ja: '日本語', ko: '한국어',
  ar: 'العربية', pt: 'Português',
  it: 'Italiano', nl: 'Nederlands', tr: 'Türkçe',
  th: 'ภาษาไทย', vi: 'Tiếng Việt', id: 'Bahasa Indonesia',
  hi: 'हिन्दी', pl: 'Polski',
};

export default function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s: AuthState) => s.user);
  const logout = useAuthStore((s: AuthState) => s.logout);

  const isHospitalDetail = location.pathname.startsWith('/hospital/');
  const isProductDetail  = location.pathname.startsWith('/product/');
  const isHomePage = location.pathname === '/';
  const lang = i18n.language;

  const navAnchorList  = isHospitalDetail ? HD_NAV_ANCHORS : isProductDetail ? PD_NAV_ANCHORS : NAV_ANCHORS;
  const navKeyList     = isHospitalDetail ? HD_NAV_KEYS    : isProductDetail ? PD_NAV_KEYS    : NAV_KEYS;
  const defaultAnchor  = isHospitalDetail ? '#hd-intro' : isProductDetail ? '#pd-intro' : '#hero';

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState(defaultAnchor);
  const [siteName, setSiteName] = useState('国际医疗');
  const [siteSubtitle, setSiteSubtitle] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [languages, setLanguages] = useState<{ code: string; label: string }[]>([
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'English' },
  ]);
  // extra i18n bundle for 3rd languages (flat key→value map)
  const [extraBundle, setExtraBundle] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // fetch configured langs
  useEffect(() => {
    api.get<string[]>('/api/config/langs')
      .then(r => {
        const codes: string[] = Array.isArray(r.data) ? r.data : [];
        if (codes.length > 0) {
          setLanguages(codes.map(code => ({ code, label: LANG_LABELS[code] ?? code.toUpperCase() })));
        }
      })
      .catch(() => {/* keep default zh/en */});
  }, []);

  // fetch 3rd-language UI bundle when lang is non-builtin
  useEffect(() => {
    const isBuiltin = lang === 'zh' || lang.startsWith('zh-') || lang === 'en' || lang.startsWith('en-');
    if (isBuiltin) {
      setExtraBundle({});
      return;
    }
    api.get<Record<string, string>>(`/api/i18n/${lang}`)
      .then(r => setExtraBundle(r.data && typeof r.data === 'object' ? r.data : {}))
      .catch(() => setExtraBundle({}));
  }, [lang]);

  useEffect(() => {
    const isZh = lang.startsWith('zh');
    const isBuiltin = isZh || lang === 'en' || lang.startsWith('en-');
    const pick = (cfg: { valueZh?: string; valueEn?: string; value3rd?: string } | null, fallbackZh: string, fallbackEn: string) => {
      if (!cfg) return isZh ? fallbackZh : fallbackEn;
      if (!isBuiltin) return cfg.value3rd || cfg.valueZh || fallbackZh;
      return isZh ? cfg.valueZh || fallbackZh : cfg.valueEn || fallbackEn;
    };

    const fetchConfig = (key: string) =>
      api.get(`/api/config/${key}`, { params: { lang } }).then((r) => r.data).catch(() => null);

    Promise.all([
      fetchConfig('site_name'),
      fetchConfig('site_subtitle'),
      fetchConfig('site_logo_url'),
    ]).then(([name, subtitle, logo]) => {
      setSiteName(pick(name, '国际医疗国际医疗共享平台', 'International Medical'));
      setSiteSubtitle(pick(subtitle, '', ''));
      setLogoUrl(logo?.valueZh || logo?.valueEn || '');
    });
  }, [lang]);

  // resolve a UI text key: use i18n for zh/en, extraBundle for 3rd languages
  const tx = (key: string): string => {
    const isBuiltin = lang === 'zh' || lang.startsWith('zh-') || lang === 'en' || lang.startsWith('en-');
    if (isBuiltin) return t(key);
    return extraBundle[key] || t(key);
  };

  const navLinks = navAnchorList.map((anchor, i) => ({
    label: tx(navKeyList[i]),
    anchor,
  }));

  const scrollTo = (anchor: string) => {
    setMobileOpen(false);
    setActiveAnchor(anchor);

    if (isHospitalDetail || isProductDetail) {
      const id = anchor.replace('#', '');
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (!isHomePage) {
      navigate('/', { state: { anchor } });
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

  const handleChangeLang = (code: string) => {
    loadLang(code).then(() => i18n.changeLanguage(code));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={`site-a-header${scrolled ? ' site-a-header--scrolled' : ''}${(lang === 'en' || lang.startsWith('en-')) ? ' site-a-header--en' : ''}`}>
      {/* Row 1: topbar */}
      <div className="site-a-header__topbar">
        <div className="site-a-header__topbar-inner">
          <div className="site-a-header__lang-switcher">
            {languages.map(lng => (
              <button
                key={lng.code}
                className={`header-lang-item${i18n.language === lng.code ? ' header-lang-item--active' : ''}`}
                onClick={() => handleChangeLang(lng.code)}
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
                  {tx('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="header-auth-link">
                  {tx('nav.login')}
                </Link>
                <Link to="/register" className="header-auth-link header-auth-link--register">
                  {tx('nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: logo + nav */}
      <div className="site-a-header__main">
        <div className="site-a-header__inner">
          <div className="site-a-header__logo" onClick={() => isHomePage ? scrollTo('#hero') : navigate('/')}>
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
            {languages.map(lng => (
              <button
                key={lng.code}
                className={`header-lang-item${i18n.language === lng.code ? ' header-lang-item--active' : ''}`}
                onClick={() => { handleChangeLang(lng.code); setMobileOpen(false); }}
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
                  {tx('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="header-auth-link" onClick={() => setMobileOpen(false)}>
                  {tx('nav.login')}
                </Link>
                <Link to="/register" className="header-auth-link header-auth-link--register" onClick={() => setMobileOpen(false)}>
                  {tx('nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
