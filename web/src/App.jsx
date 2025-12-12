import React from 'react';
import HeroSection from './components/HeroSection';
import QuickSearchPanel from './components/QuickSearchPanel';
import DatasetOverview from './components/DatasetOverview';
import GuidedEntry from './components/GuidedEntry';
import AdvancedPreview from './components/AdvancedPreview';
import TrustAttribution from './components/TrustAttribution';

const App = () => {
  return (
    <div className="page">
      <HeroSection />
      <QuickSearchPanel />
      <DatasetOverview />
      <GuidedEntry />
      <AdvancedPreview />
      <TrustAttribution />
      <footer className="footer-note">
        Built for chemists who value clarity, reproducibility, and quick access to vetted pK data.
      </footer>
    </div>
  );
};

export default App;
