import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import type { SiteConfig } from '../../types';
import logoImg from '../../assets/logo.png';
import bannerImg from '../../assets/banner.png';
import './HeroSection.less';


export default function HeroSection() {
  const { t, i18n } = useTranslation();
  const [siteIntro, setSiteIntro] = useState<SiteConfig | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    api
      .get<SiteConfig>('/api/config/site_intro')
      .then((res) => setSiteIntro(res.data))
      .catch(() => setSiteIntro(null));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const lang = i18n.language === 'zh' ? 'zh' : 'en';
  const introText = siteIntro
    ? lang === 'zh' ? siteIntro.valueZh : siteIntro.valueEn
    : t('hero.subtitle_fallback');

  void introText;

  return (
    <section id="hero" className="hero-section">
      <div className="hero-bg" />
      <div className="hero-accent-stripe" />

      <div className="hero-content">
        <div className={`hero-visual${visible ? ' hero-visual--visible' : ''}`}>
          <img src={logoImg} alt="SCO Logo" className="hero-visual__logo" />
          <img src={bannerImg} alt="SCO Member Countries Map" className="hero-visual__banner" />
        </div>
      </div>
    </section>
  );
}
