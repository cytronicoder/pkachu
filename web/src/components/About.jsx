const About = () => {
  return (
    <div className="panel">
      <div className="panel__header">
        <h3>About This Data</h3>
      </div>
      <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "var(--accent)" }}>
            Dataset Version
          </h4>
          <p style={{ margin: "0" }}>v2.3c - IUPAC Digitized pKa Dataset</p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "var(--accent)" }}>
            Data Sources
          </h4>
          <ul style={{ margin: "0", paddingLeft: "20px" }}>
            <li>
              <strong>Serjeant:</strong> E.P. Serjeant and B. Dempsey.{" "}
              <em>Ionisation Constants of Organic Acids in Aqueous Solution</em>
              . Oxford/Pergamon, 1979. (Oxford IUPAC Chemical Data Series)
            </li>
            <li>
              <strong>Perrin:</strong> D.D. Perrin.{" "}
              <em>
                Dissociation Constants of Organic Bases in Aqueous Solution
              </em>
              . Butterworths, 1965
            </li>
            <li>
              <strong>Perrin Supplement:</strong> D.D. Perrin.{" "}
              <em>
                Dissociation Constants of Organic Bases in Aqueous Solution,
                Supplement
              </em>
              . Butterworths, 1972
            </li>
          </ul>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "var(--accent)" }}>
            Contributors & Acknowledgements
          </h4>
          <ul style={{ margin: "0", paddingLeft: "20px", fontSize: "13px" }}>
            <li>
              <strong>Data Digitization & Curation:</strong> Jonathan Zheng (MIT
              Green Group, ORCID: 0000-0002-4863-1325)
            </li>
            <li>
              <strong>Further Processing & Curation:</strong> Olivier
              Lafontant-Joseph (MIT Green Group)
            </li>
            <li>
              <strong>MIT Libraries:</strong> Ye Li
            </li>
            <li>
              <strong>IUPAC Volunteers:</strong> Leah McEwen, Stuart Chalk
            </li>
            <li>
              <strong>PubChem Volunteers:</strong> Evan Bolton, Jeff Zhang
            </li>
          </ul>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "var(--accent)" }}>
            License & Citation
          </h4>
          <p style={{ margin: "0 0 8px 0" }}>
            This data is licensed under <strong>CC BY-NC 4.0</strong> with
            attribution to the International Union of Pure and Applied Chemistry
            (IUPAC).
          </p>
          <p style={{ margin: "0", fontSize: "12px", color: "var(--muted)" }}>
            Zheng, J.W. and Lafontant-Joseph, O. (2025) IUPAC Digitized pKa
            Dataset, v2.3c. DOI: 10.5281/zenodo.7236453
          </p>
        </div>

        <div>
          <h4 style={{ margin: "0 0 8px 0", color: "var(--accent)" }}>
            Data Quality
          </h4>
          <p style={{ margin: "0" }}>
            This is an early release of a high-confidence dataset. The
            assessment column indicates data reliability:{" "}
            <strong>Reliable</strong> (±0.005), <strong>Approximate</strong>{" "}
            (±0.04), or <strong>Uncertain</strong> (&gt;±0.04). For detailed
            information on data processing and quality assurance, see the full{" "}
            <a
              href="https://github.com/IUPAC/Dissociation-Constants"
              style={{ color: "var(--accent)" }}
            >
              documentation
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
