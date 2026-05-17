import { useState } from 'react';
import ScoSection from './ScoSection';
import TabSection from './TabSection';
import HospitalsSection from './HospitalsSection';
import EquipmentSection from './EquipmentSection';
import CasesSection from './CasesSection';
import ProductsSection from './ProductsSection';
import CtaSection from './CtaSection';
import Footer from '../../components/Footer';
import './index.less';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'professional' | 'special'>('professional');

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
      <CtaSection />
      <Footer />
    </main>
  );
}
