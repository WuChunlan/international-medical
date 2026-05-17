import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import flagYd from '../../assets/yd.png';
import flagYl from '../../assets/yl.png';
import flagKazakhstan from '../../assets/Kazakhstan.png';
import flagChina from '../../assets/china.png';
import flagJierjisi from '../../assets/jierjisi.png';
import flagBajisitan from '../../assets/bajisitan.png';
import flagLianbang from '../../assets/lianbang.png';
import flagTajikesitan from '../../assets/tajikesitan.png';
import flagWuzibiekesitan from '../../assets/wuzibiekesitan.png';
import banner1 from '../../assets/scotemp_banner1.webp';
import banner2 from '../../assets/scotemp_banner2.webp';
import './ScoSection.less';

const SLIDES = [banner1, banner2];

const STATS = {
  zh: [
    { value: '50+', label: '合作顶尖医院' },
    { value: '200+', label: '权威专家团队' },
    { value: '10,000+', label: '成功服务患者' },
    { value: '30+', label: '覆盖国家地区' },
  ],
  en: [
    { value: '50+', label: 'Partner Hospitals' },
    { value: '200+', label: 'Expert Specialists' },
    { value: '10,000+', label: 'Patients Served' },
    { value: '30+', label: 'Countries Covered' },
  ],
};

const COUNTRIES = {
  zh: [
    { flag: flagYd, name: '印度共和国' },
    { flag: flagYl, name: '伊朗伊斯兰共和国' },
    { flag: flagKazakhstan, name: '哈萨克斯坦共和国' },
    { flag: flagChina, name: '中华人民共和国' },
    { flag: flagJierjisi, name: '吉尔吉斯共和国' },
    { flag: flagBajisitan, name: '巴基斯坦伊斯兰共和国' },
    { flag: flagLianbang, name: '俄罗斯联邦' },
    { flag: flagTajikesitan, name: '塔吉克斯坦共和国' },
    { flag: flagWuzibiekesitan, name: '乌兹别克斯坦共和国' },
  ],
  en: [
    { flag: flagYd, name: 'India' },
    { flag: flagYl, name: 'Iran' },
    { flag: flagKazakhstan, name: 'Kazakhstan' },
    { flag: flagChina, name: 'China' },
    { flag: flagJierjisi, name: 'Kyrgyzstan' },
    { flag: flagBajisitan, name: 'Pakistan' },
    { flag: flagLianbang, name: 'Russia' },
    { flag: flagTajikesitan, name: 'Tajikistan' },
    { flag: flagWuzibiekesitan, name: 'Uzbekistan' },
  ],
};

export default function ScoSection() {
  const { i18n } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lang = i18n.language === 'zh' ? 'zh' : 'en';
  const countries = COUNTRIES[lang];
  const stats = STATS[lang];

  const goTo = (index: number) => {
    if (animating) return;
    setAnimating(true);
    setCurrent(index);
    setTimeout(() => setAnimating(false), 1500);
  };

  const prev = () => goTo((current - 1 + SLIDES.length) % SLIDES.length);
  const next = () => goTo((current + 1) % SLIDES.length);

  // Auto-play every 5s
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % SLIDES.length);
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Reset timer on manual nav
  const handleNav = (fn: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current);
    fn();
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % SLIDES.length);
    }, 5000);
  };

  // Stats intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.1 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="sco-section">
      {/* ── Banner carousel ── */}
      <div className="sco-banner">
        {SLIDES.map((src, i) => (
          <div
            key={i}
            className={`sco-banner__slide${i === current ? ' sco-banner__slide--active' : ''}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}

        {/* Arrows */}
        <button
          className="sco-banner__arrow sco-banner__arrow--prev"
          onClick={() => handleNav(prev)}
          aria-label="Previous"
        >
          &#8249;
        </button>
        <button
          className="sco-banner__arrow sco-banner__arrow--next"
          onClick={() => handleNav(next)}
          aria-label="Next"
        >
          &#8250;
        </button>

        {/* Dots */}
        <div className="sco-banner__dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`sco-banner__dot${i === current ? ' sco-banner__dot--active' : ''}`}
              onClick={() => handleNav(() => goTo(i))}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div ref={statsRef} className="sco-stats">
        <div className="sco-stats__inner">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`sco-stat-item${statsVisible ? ' sco-stat-item--visible' : ' sco-stat-item--hidden'}`}
              style={statsVisible ? { animationDelay: `${i * 0.1}s` } : undefined}
            >
              <div className="sco-stat-item__value">{stat.value}</div>
              <div className="sco-stat-item__label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Flags bar ── */}
      <div className="sco-flags">
        <div className="sco-flags__inner">
          {countries.map((c, i) => (
            <div key={i} className="sco-flag-item">
              <img src={c.flag} alt={c.name} />
              <span>{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
