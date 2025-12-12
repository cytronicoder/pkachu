import React from 'react';

const GuidedEntry = () => (
  <section className="panel guided" aria-labelledby="guided-entry-title">
    <div>
      <p className="eyebrow">New to pKa?</p>
      <h2 id="guided-entry-title">A 30-second primer</h2>
      <p className="panel__lede">
        pKa describes how readily a molecule donates or accepts a proton in water. Lower values mean stronger acids; higher values
        point to weaker acids or stronger bases. Context matters—temperature, ionic strength, and molecular environment shape each reported value.
      </p>
    </div>
    <div className="guided__grid">
      {/* Bite-sized guidance keeps novices oriented without overwhelming them with theory. */}
      <div className="guided__tip">
        <h3>Reading the notation</h3>
        <p>
          pKa values are acidic; pKaH values capture conjugate acids of bases; pKb values express basic dissociation. Amphoteric species may have multiple values across sites.
        </p>
      </div>
      <div className="guided__tip">
        <h3>Check the conditions</h3>
        <p>
          Each entry keeps its temperature, ionic strength, and method where provided. Use filters to narrow to the conditions matching your experiment.
        </p>
      </div>
      <div className="guided__tip">
        <h3>Stay with provenance</h3>
        <p>
          Every datapoint links back to the original IUPAC reference work, method codes, and uncertainty assessments so you can judge suitability at a glance.
        </p>
      </div>
    </div>
  </section>
);

export default GuidedEntry;
