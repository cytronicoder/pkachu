import React, { useState } from 'react';

const QuickSearchPanel = () => {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <section className="panel" aria-labelledby="quick-search-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Start here</p>
          <h2 id="quick-search-title">Quick search</h2>
          <p className="panel__lede">Zero-friction search for compound names, structural identifiers, or pKa ranges.</p>
        </div>
        <button
          className="link-button"
          onClick={() => setAdvancedOpen((open) => !open)}
          aria-expanded={advancedOpen}
          aria-controls="advanced-search"
        >
          {advancedOpen ? 'Hide advanced filters' : 'Advanced filters'}
        </button>
      </div>
      <div className="search-grid">
        <label className="field">
          <span>Compound name</span>
          <input type="text" placeholder="e.g., acetic acid" aria-label="Compound name" />
        </label>
        <label className="field">
          <span>SMILES / InChI</span>
          <input type="text" placeholder="Paste a SMILES or InChI" aria-label="SMILES or InChI" />
        </label>
        <label className="field">
          <span>pKa range</span>
          <div className="range-fields">
            <input type="number" step="0.01" placeholder="min" aria-label="Minimum pKa" />
            <span className="range-dash">—</span>
            <input type="number" step="0.01" placeholder="max" aria-label="Maximum pKa" />
          </div>
        </label>
        <button className="btn btn-primary search-button">Search dataset</button>
      </div>
      {advancedOpen && (
        <div className="advanced" id="advanced-search">
          {/* Progressive disclosure keeps novices focused while keeping expert filters one click away. */}
          <div className="advanced__row">
            <label className="field">
              <span>pKa type</span>
              <select aria-label="pKa type">
                <option>Any</option>
                <option>Acidic (pKa)</option>
                <option>Conjugate acid (pKaH)</option>
                <option>Basic (pKb)</option>
              </select>
            </label>
            <label className="field">
              <span>Temperature (°C)</span>
              <div className="range-fields">
                <input type="number" placeholder="from" aria-label="Temperature from" />
                <span className="range-dash">—</span>
                <input type="number" placeholder="to" aria-label="Temperature to" />
              </div>
            </label>
            <label className="field">
              <span>Ionic strength (I)</span>
              <input type="text" placeholder="e.g., 0.1" aria-label="Ionic strength" />
            </label>
          </div>
          <div className="advanced__row">
            <label className="field">
              <span>Method</span>
              <input type="text" placeholder="e.g., potentiometry code" aria-label="Method code" />
            </label>
            <label className="field">
              <span>Assessment</span>
              <select aria-label="Assessment">
                <option>Any</option>
                <option>Reliable</option>
                <option>Approximate</option>
                <option>Uncertain</option>
              </select>
            </label>
            <label className="field">
              <span>Data quality flags</span>
              <input type="text" placeholder="e.g., thermodynamic correction" aria-label="Data quality flags" />
            </label>
          </div>
        </div>
      )}
    </section>
  );
};

export default QuickSearchPanel;
