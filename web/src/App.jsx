import Papa from "papaparse";
import { useEffect, useState } from "react";
import About from "./components/About";
import SearchInterface from "./components/SearchInterface";
import "./styles.css";

const App = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState("search");

  useEffect(() => {
    Papa.parse("/data.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data);
        setLoading(false);
        setError(null);
      },
      error: (err) => {
        console.error("Error parsing CSV:", err);
        setLoading(false);
        setError("Failed to load data. Please try refreshing the page.");
      },
    });
  }, []);

  return (
    <div className="page">
      <header
        style={{
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1>pKachu</h1>
            <img src="/pkachu.png" alt="pKachu sticker" className="sticker" />
          </div>
          <p style={{ color: "var(--muted)" }}>
            Gotta catch 'em all, one proton at a time.
          </p>
        </div>
        <nav style={{ display: "flex", gap: "16px" }}>
          <button
            onClick={() => setCurrentPage("search")}
            className={`btn ${
              currentPage === "search" ? "btn-primary" : "btn-secondary"
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setCurrentPage("about")}
            className={`btn ${
              currentPage === "about" ? "btn-primary" : "btn-secondary"
            }`}
          >
            About the Data
          </button>
        </nav>
      </header>

      {loading ? (
        <div className="panel">Loading dataset...</div>
      ) : error ? (
        <div className="panel error">{error}</div>
      ) : currentPage === "search" ? (
        <SearchInterface data={data} loading={false} />
      ) : (
        <About />
      )}
    </div>
  );
};

export default App;
