import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './index.less';

interface TabSectionProps {
  activeTab: 'professional' | 'special';
  onTabChange: (tab: 'professional' | 'special') => void;
}

export default function TabSection({ activeTab, onTabChange }: TabSectionProps) {
  const { t, i18n } = useTranslation();
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const lang = i18n.language === 'zh' ? 'zh' : 'en';

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const tabs = [
    {
      key: 'professional' as const,
      label: t('tabs.professional'),
      desc: t('tabs.professional_desc'),
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      ),
      tag: lang === 'zh' ? '专科诊疗' : 'Specialist Care',
    },
    {
      key: 'special' as const,
      label: t('tabs.special'),
      desc: t('tabs.special_desc'),
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      tag: lang === 'zh' ? '定制服务' : 'Custom Service',
    },
  ];

  return (
    <div
      id="tabs"
      ref={ref}
      className={`tab-section section-reveal${visible ? ' section-reveal--visible section-reveal--fast' : ''}`}
    >
      <div className="tab-section__inner">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              className={`tab-card${isActive ? ' active' : ''}`}
              onClick={() => onTabChange(tab.key)}
              aria-pressed={isActive}
            >
              <div className="tab-card-inner">
                <div className="tab-icon-wrap">{tab.icon}</div>
                <div className="tab-text">
                  <div className="tab-heading">
                    <div className="tab-tag">{tab.tag}</div>
                    <div className="tab-title">{tab.label}</div>
                  </div>
                  <p className="tab-desc">{tab.desc}</p>
                </div>
                <div className="tab-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </div>
              {isActive && <div className="tab-active-bar" />}
              {idx === 0 && <div className="tab-card-divider" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
