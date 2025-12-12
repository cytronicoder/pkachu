import React from 'react';

const stats = [
  { label: 'pK datapoints', value: '24,211', detail: 'All entries curated from IUPAC reference books.' },
  { label: 'Unique molecules', value: '10,626', detail: 'SMILES and InChI harmonized where available.' },
  { label: 'Temperature-aware', value: 'Includes T column', detail: 'Temperature context preserved per entry when reported.' },
  { label: 'Methods & assessments', value: 'Documented', detail: 'Method codes and uncertainty assessments kept intact.' },
];

const DatasetOverview = () => (
  <section className="panel" aria-labelledby="dataset-overview-title">
    <p className="eyebrow">Scope at a glance</p>
    <div className="panel__header">
      <div>
        <h2 id="dataset-overview-title">Dataset overview</h2>
        <p className="panel__lede">High-confidence, aqueous dissociation constants with provenance captured for every record.</p>
      </div>
      <a className="link-button" href="#trust">View curation notes</a>
    </div>
    <div className="stats-grid">
      {stats.map((stat) => (
        <article key={stat.label} className="stat-card" aria-label={`${stat.label} summary`}>
          <div className="stat-card__value">{stat.value}</div>
          <div className="stat-card__label">{stat.label}</div>
          <p className="stat-card__detail">{stat.detail}</p>
          <div className="stat-card__bar">
            <span />
          </div>
        </article>
      ))}
    </div>
    <div className="inline-cards">
      <div className="inline-card">
        <h3>Distribution snapshot</h3>
        <p>Balanced coverage of acidic and basic constants with amphoteric species noted explicitly.</p>
      </div>
      <div className="inline-card">
        <h3>Filters from the start</h3>
        <p>Search by pKa type, temperature, ionic strength, method code, and assessment without leaving the homepage.</p>
      </div>
      <div className="inline-card">
        <h3>Export-friendly</h3>
        <p>Downloadable CSV/JSON views and programmatic access endpoints are highlighted before you dive in.</p>
      </div>
    </div>
  </section>
);

export default DatasetOverview;
