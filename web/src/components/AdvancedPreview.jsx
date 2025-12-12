import React from 'react';

const AdvancedPreview = () => (
  <section className="panel" aria-labelledby="advanced-capabilities-title">
    <div className="panel__header">
      <div>
        <p className="eyebrow">Power users</p>
        <h2 id="advanced-capabilities-title">Advanced capabilities preview</h2>
        <p className="panel__lede">Designed for reproducible workflows, bulk filtering, and exports without sacrificing clarity.</p>
      </div>
      <button className="btn btn-secondary">View API & downloads</button>
    </div>
    <div className="capabilities-grid">
      {/* Upfront preview reassures experts that the full toolkit is available before they invest time. */}
      <div className="capability">
        <h3>Filter deeply</h3>
        <ul>
          <li>pKa type: acidic, conjugate acid, basic</li>
          <li>Temperature & ionic strength filters</li>
          <li>Method and uncertainty assessments</li>
        </ul>
      </div>
      <div className="capability">
        <h3>Inspect metadata</h3>
        <ul>
          <li>Original IUPAC names alongside SMILES/InChI</li>
          <li>Reference codes tied to source books</li>
          <li>Remarks for entry-level and dataset-level context</li>
        </ul>
      </div>
      <div className="capability">
        <h3>Take data with you</h3>
        <ul>
          <li>Download filtered tables (CSV, JSON)</li>
          <li>Programmatic access for pipelines</li>
          <li>Export-ready uncertainty and method fields</li>
        </ul>
      </div>
    </div>
  </section>
);

export default AdvancedPreview;
