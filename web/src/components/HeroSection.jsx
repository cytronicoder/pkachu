import React from 'react';

const HeroSection = () => (
  <header className="hero">
    <div className="hero__content">
      <div className="hero__badge">IUPAC-digitized • Aqueous pK values</div>
      <h1>Authoritative pKa data, ready for analysis</h1>
      <p className="hero__tagline">
        Search and explore experimentally measured dissociation constants curated from IUPAC reference books, with transparent metadata and precision built in.
      </p>
      <div className="hero__actions">
        <button className="btn btn-primary">Search pKa Data</button>
        <button className="btn btn-secondary">Browse Molecules</button>
        <a className="hero__link" href="#trust">About / Data Sources</a>
      </div>
      <div className="hero__meta">
        {/* Quick signals that make the scientific rigor obvious even for first-time visitors. */}
        <span>FAIR-focused curation</span>
        <span>Clean SMILES/InChI ready</span>
        <span>Temperature & method context preserved</span>
      </div>
    </div>
    <div className="hero__visual" aria-hidden="true">
      <div className="orbital" />
      <div className="orbitals orbitals--secondary" />
      <div className="hero__caption">Grounded in equilibria and aqueous chemistry</div>
    </div>
  </header>
);

export default HeroSection;
