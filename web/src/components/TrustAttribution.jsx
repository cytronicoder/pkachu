import React from 'react';

const TrustAttribution = () => (
  <section className="panel trust" id="trust" aria-labelledby="trust-title">
    <div>
      <p className="eyebrow">Trust & attribution</p>
      <h2 id="trust-title">Provenance you can cite</h2>
      <p className="panel__lede">
        Digitized from IUPAC reference books with permission, curated for accuracy, and released under CC BY-NC 4.0. Every record traces back to its source with method and assessment context intact.
      </p>
    </div>
    <div className="trust__grid">
      <div className="trust__item">
        <h3>IUPAC lineage</h3>
        <p>Data derived from the Serjeant and Perrin aqueous pK reference works, scanned and cross-checked for fidelity.</p>
      </div>
      <div className="trust__item">
        <h3>Transparent curation</h3>
        <p>Validation includes distribution checks, typo scans, and manual review of ambiguous acidity labels before inclusion.</p>
      </div>
      <div className="trust__item">
        <h3>Documentation first</h3>
        <p>Read the digitization report and see the repository for workflows, method codes, and reference translations.</p>
        <div className="trust__links">
          <a className="link-button" href="./IUPAC_pK_DataDigitizationReport.pdf">Digitization report</a>
          <a className="link-button" href="https://doi.org/10.5281/zenodo.7236453">Zenodo DOI</a>
        </div>
      </div>
    </div>
  </section>
);

export default TrustAttribution;
