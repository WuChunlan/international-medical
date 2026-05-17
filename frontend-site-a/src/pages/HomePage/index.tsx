import { useState, useEffect } from 'react';
import ScoSection from './ScoSection/index';
import TabSection from './TabSection/index';
import HospitalsSection from './HospitalsSection/index';
import EquipmentSection from './EquipmentSection/index';
import CasesSection from './CasesSection/index';
import ProductsSection from './ProductsSection/index';
import CtaSection from './CtaSection/index';
import Footer from '../../components/Footer';
import './index.less';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'professional' | 'special'>('professional');
  const [pendingScroll, setPendingScroll] = useState<string | null>(null);

  // Listen for nav requests that require a tab switch before scrolling
  useEffect(() => {
    const handler = (e: Event) => {
      const { tab, anchor } = (e as CustomEvent).detail;
      setActiveTab(tab);
      setPendingScroll(anchor);
    };
    window.addEventListener('nav:switch-tab', handler);
    return () => window.removeEventListener('nav:switch-tab', handler);
  }, []);

  // After tab switch re-renders the target section, scroll to it
  useEffect(() => {
    if (!pendingScroll) return;
    const el = document.getElementById(pendingScroll);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => setPendingScroll(null), 0);
    }
  }, [activeTab, pendingScroll]);

  return (
    <main className="home-page">
      <ScoSection />
      <TabSection activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'professional' ? (
        <>
          <HospitalsSection />
          <EquipmentSection />
          <CasesSection />
        </>
      ) : (
        <ProductsSection />
      )}
      {/* <CtaSection />
      <Footer /> */}
    </main>
  );
}
