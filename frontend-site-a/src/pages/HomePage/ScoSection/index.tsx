import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import banner1 from '../../../assets/scotemp_banner1.webp';
import banner2 from '../../../assets/scotemp_banner2.webp';
import './index.less';

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

export default function ScoSection() {
  const { i18n } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lang = i18n.language === 'zh' ? 'zh' : 'en';
  const stats = STATS[lang];

  const goTo = (index: number) => {
    if (animating) return;
    setAnimating(true);
    setCurrent(index);
    setTimeout(() => setAnimating(false), 1500);
  };

  const prev = () => goTo((current - 1 + SLIDES.length) % SLIDES.length);
  const next = () => goTo((current + 1) % SLIDES.length);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % SLIDES.length);
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleNav = (fn: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current);
    fn();
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % SLIDES.length);
    }, 5000);
  };

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
      <div className="sco-banner">
        <div className="sco-banner__ratio">
          {SLIDES.map((src, i) => (
            <div
              key={i}
              className={`sco-banner__slide${i === current ? ' sco-banner__slide--active' : ''}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
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
        </div>
      </div>

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
    </section>
  );
}
