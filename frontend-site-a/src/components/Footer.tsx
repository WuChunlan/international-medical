import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useContacts } from '../hooks/useContacts';
import './Footer.less';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language.startsWith('zh');
  const [modalOpen, setModalOpen] = useState(false);
  const contacts = useContacts();

  return (
    <>
      <footer className="site-footer">
        <div className="section-container">
          <div className="site-footer__top">
            <div className="site-footer__logo">
              <div className="site-footer__logo-emblem">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="var(--gold)"/>
                </svg>
              </div>
              <div>
                <div className="site-footer__logo-name">国际医疗共享平台</div>
                <div className="site-footer__logo-sub">International Medical</div>
              </div>
            </div>

            <p className="site-footer__tagline">{t('footer.tagline')}</p>

            <button className="site-footer__contact-cta" onClick={() => setModalOpen(true)}>
              <span>{isZh ? '合作请联系' : 'Contact Us'}</span>
              <svg className="site-footer__cta-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          <div className="site-footer__bottom">
            <p className="site-footer__copyright">{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>

      {modalOpen && (
        <div className="footer-contact-overlay" onClick={() => setModalOpen(false)}>
          <div className="footer-contact-modal" onClick={e => e.stopPropagation()}>
            <button className="footer-contact-modal__close" onClick={() => setModalOpen(false)} aria-label="关闭">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            <div className="footer-contact-modal__icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
              </svg>
            </div>
            <h3 className="footer-contact-modal__title">
              {isZh ? '联系我们' : 'Contact Us'}
            </h3>
            <div className="footer-contact-modal__divider" />
            {contacts.length === 0 ? (
              <p className="footer-contact-modal__loading">{t('common.loading')}</p>
            ) : (
              <div className="footer-contact-modal__body">
                {contacts.map((c, i) => (
                  <div key={i} className="footer-contact-modal__row" style={{ marginBottom: i < contacts.length - 1 ? 12 : 0 }}>
                    <span className="footer-contact-modal__label">{isZh ? '联系人' : 'Contact'}</span>
                    <span className="footer-contact-modal__value">{c.name || '—'}</span>
                    <span className="footer-contact-modal__label" style={{ marginLeft: 16 }}>{isZh ? '电话' : 'Phone'}</span>
                    <span className="footer-contact-modal__value">{c.phone || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
