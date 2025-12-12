import { useEffect, useMemo, useState } from "react";

const calculateSearchScore = (row, query) => {
  if (!query.trim()) return 0;

  const lowerQuery = query.toLowerCase().trim();
  let totalScore = 0;

  const fieldWeights = {
    original_IUPAC_names: 100,
    SMILES: 80,
    pka_type: 60,
    unique_ID: 40,
    InChI: 30,
    pka_value: 20,
  };

  Object.entries(fieldWeights).forEach(([field, baseWeight]) => {
    const fieldValue = String(row[field] || "").toLowerCase();

    if (fieldValue.includes(lowerQuery)) {
      let fieldScore = baseWeight;

      if (fieldValue === lowerQuery) {
        fieldScore *= 3;
      } else if (fieldValue.startsWith(lowerQuery)) {
        fieldScore *= 2;
      }

      const lengthRatio = lowerQuery.length / fieldValue.length;
      if (lengthRatio > 0.8) {
        fieldScore *= 1.5;
      } else if (lengthRatio > 0.5) {
        fieldScore *= 1.2;
      }

      const matchIndex = fieldValue.indexOf(lowerQuery);
      if (matchIndex === 0) {
        fieldScore *= 1.3;
      } else if (matchIndex < fieldValue.length * 0.2) {
        fieldScore *= 1.1;
      }

      totalScore += fieldScore;
    }
  });

  const matchingFields = Object.keys(fieldWeights).filter((field) =>
    String(row[field] || "")
      .toLowerCase()
      .includes(lowerQuery)
  );
  if (matchingFields.length > 1) {
    totalScore *= 1 + matchingFields.length * 0.1;
  }

  if (!isNaN(parseFloat(lowerQuery))) {
    const pkaValue = parseFloat(row.pka_value);
    const searchValue = parseFloat(lowerQuery);
    if (!isNaN(pkaValue)) {
      if (Math.abs(pkaValue - searchValue) < 0.1) {
        totalScore += 200;
      } else if (Math.abs(pkaValue - searchValue) < 1) {
        totalScore += 100;
      }
    }
  }

  return totalScore;
};

const DEFAULT_RESULTS_LIMIT = 100;

const SearchInterface = ({ data, loading }) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [limit, setLimit] = useState(DEFAULT_RESULTS_LIMIT);
  const [sortBy, setSortBy] = useState("pka_value");
  const [sortOrder, setSortOrder] = useState("asc");
  const [columnSorts, setColumnSorts] = useState({});
  const [filterType, setFilterType] = useState("all");
  const [minPka, setMinPka] = useState("");
  const [maxPka, setMaxPka] = useState("");
  const [assessment, setAssessment] = useState("all");

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const filteredData = useMemo(() => {
    let results = data;

    if (debouncedQuery.trim()) {
      results = data.map((row) => ({
        ...row,
        searchScore: calculateSearchScore(row, debouncedQuery),
      }));
    }

    if (debouncedQuery.trim()) {
      results = results.filter((row) => row.searchScore > 0);
    }

    if (filterType !== "all") {
      results = results.filter((row) => row.pka_type === filterType);
    }

    if (minPka) {
      results = results.filter(
        (row) => parseFloat(row.pka_value) >= parseFloat(minPka)
      );
    }

    if (maxPka) {
      results = results.filter(
        (row) => parseFloat(row.pka_value) <= parseFloat(maxPka)
      );
    }

    if (assessment !== "all") {
      results = results.filter((row) => row.assessment === assessment);
    }

    results.sort((a, b) => {
      const activeColumnSorts = Object.entries(columnSorts).filter(
        ([_, order]) => order !== null
      );

      if (activeColumnSorts.length > 0) {
        const [columnKey, order] = activeColumnSorts[0];
        let aVal = a[columnKey];
        let bVal = b[columnKey];

        if (columnKey === "pka_value" || columnKey === "T") {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        } else {
          aVal = String(aVal || "").toLowerCase();
          bVal = String(bVal || "").toLowerCase();
        }

        if (aVal < bVal) return order === "asc" ? -1 : 1;
        if (aVal > bVal) return order === "asc" ? 1 : -1;
        return 0;
      }

      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "pka_value" || sortBy === "T") {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (sortBy === "relevance") {
        aVal = a.searchScore || 0;
        bVal = b.searchScore || 0;
      } else {
        aVal = String(aVal || "").toLowerCase();
        bVal = String(bVal || "").toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;

      if (
        debouncedQuery.trim() &&
        sortBy !== "relevance" &&
        a.searchScore !== b.searchScore
      ) {
        return b.searchScore - a.searchScore;
      }

      return 0;
    });

    return results.slice(0, limit);
  }, [
    data,
    debouncedQuery,
    limit,
    sortBy,
    sortOrder,
    columnSorts,
    filterType,
    minPka,
    maxPka,
    assessment,
  ]);

  if (loading) {
    return <div className="panel">Loading dataset...</div>;
  }

  const pkaTypes = [
    ...new Set(data.map((r) => r.pka_type).filter(Boolean)),
  ].sort();
  const assessments = [
    ...new Set(data.map((r) => r.assessment).filter(Boolean)),
  ].sort();

  const renderSortableHeader = (label, columnKey) => {
    const currentSort = columnSorts[columnKey];

    return (
      <th
        className="sortable-header"
        style={{ padding: "12px" }}
        onClick={() => handleColumnSort(columnKey)}
        title={`Click to sort by ${label}`}
      >
        <span className="header-content">
          {label}
          <span className="sort-arrows">
            <span
              className={`arrow up ${currentSort === "asc" ? "active" : ""}`}
            >
              ▲
            </span>
            <span
              className={`arrow down ${currentSort === "desc" ? "active" : ""}`}
            >
              ▼
            </span>
          </span>
        </span>
      </th>
    );
  };

  const handleColumnSort = (columnKey) => {
    setColumnSorts((prev) => {
      const currentSort = prev[columnKey];
      let newSort;

      if (!currentSort) {
        newSort = "asc";
      } else if (currentSort === "asc") {
        newSort = "desc";
      } else {
        newSort = null;
      }

      const newColumnSorts = { [columnKey]: newSort };
      return newColumnSorts;
    });
  };

  const handleResetFilters = () => {
    setQuery("");
    setMinPka("");
    setMaxPka("");
    setFilterType("all");
    setAssessment("all");
    setSortBy("pka_value");
    setSortOrder("asc");
    setColumnSorts({});
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = [
      "unique_ID",
      "original_IUPAC_names",
      "SMILES",
      "pka_type",
      "pka_value",
      "T",
      "method",
      "assessment",
      "remarks",
      "source",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredData.map((row) =>
        headers
          .map((header) => {
            const value = row[header] || "";
            const escaped = String(value).includes(",")
              ? `"${String(value).replace(/"/g, '""')}"`
              : value;
            return escaped;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pka_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (filteredData.length === 0) {
      alert("No data to export");
      return;
    }

    const blob = new Blob([JSON.stringify(filteredData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pka_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="search-interface"
      style={{
        display: "grid",
        gridTemplateColumns: "380px 1fr",
        gap: "16px",
        alignItems: "start",
        height: "calc(100vh - 200px)",
      }}
    >
      <section
        className="panel"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <div className="panel__header">
          <div>
            <h2 id="search-title">Search & Filter</h2>
            <p className="panel__lede">
              Find compounds by name, structure, or pKa properties.
            </p>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px" }}>
          <div
            className="search-grid"
            style={{
              gridTemplateColumns: "1fr",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <label htmlFor="search-input" className="field">
              <span id="search-label">Search (Name, SMILES, pKa)</span>
              <input
                id="search-input"
                type="text"
                placeholder="e.g., acetic acid or CC(=O)O or 4.75"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="search-input"
                aria-label="Search compounds by name, SMILES structure, or pKa value"
                aria-describedby="search-label search-hint"
                role="searchbox"
              />
              <span
                id="search-hint"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--muted)",
                  marginTop: "4px",
                  display: "block",
                }}
              >
                Search is debounced for performance
              </span>
            </label>
          </div>

          <div
            className="search-grid"
            style={{
              gridTemplateColumns: "1fr",
              gap: "16px",
            }}
          >
            <label htmlFor="filter-type" className="field">
              <span id="filter-type-label">pKa Type</span>
              <select
                id="filter-type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                aria-label="Filter by pKa type"
                aria-describedby="filter-type-label"
              >
                <option value="all">All Types</option>
                {pkaTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span id="pka-range-label">pKa Range</span>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <input
                  id="min-pka"
                  type="number"
                  step="0.1"
                  placeholder="min"
                  value={minPka}
                  onChange={(e) => setMinPka(e.target.value)}
                  style={{ width: "50%" }}
                  aria-label="Minimum pKa value"
                  aria-describedby="pka-range-label"
                />
                <span aria-hidden="true">—</span>
                <input
                  id="max-pka"
                  type="number"
                  step="0.1"
                  placeholder="max"
                  value={maxPka}
                  onChange={(e) => setMaxPka(e.target.value)}
                  style={{ width: "50%" }}
                  aria-label="Maximum pKa value"
                  aria-describedby="pka-range-label"
                />
              </div>
            </label>

            <label htmlFor="assessment" className="field">
              <span id="assessment-label">Assessment</span>
              <select
                id="assessment"
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                aria-label="Filter by assessment status"
                aria-describedby="assessment-label"
              >
                <option value="all">All</option>
                {assessments.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="sort-by" className="field">
              <span id="sort-by-label">Sort By</span>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort results by field"
                aria-describedby="sort-by-label"
              >
                {query.trim() && <option value="relevance">Relevance</option>}
                <option value="pka_value">pKa Value</option>
                <option value="T">Temperature</option>
                <option value="pka_type">Type</option>
                <option value="assessment">Assessment</option>
                <option value="unique_ID">ID</option>
              </select>
            </label>

            <label className="field">
              <span>Order</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </label>

            <label className="field">
              <span>Results Per Page</span>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
              </select>
            </label>
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              background: "rgba(255, 215, 0, 0.05)",
              borderRadius: "8px",
              border: "1px solid var(--border)",
            }}
          >
            <p
              style={{
                margin: "0 0 12px 0",
                fontSize: "13px",
                color: "var(--muted)",
              }}
            >
              Export Results:
            </p>
            <div
              style={{ display: "flex", gap: "8px", flexDirection: "column" }}
            >
              <button
                onClick={handleExportCSV}
                className="btn btn-secondary"
                style={{ width: "100%" }}
              >
                Export CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="btn btn-secondary"
                style={{ width: "100%" }}
              >
                Export JSON
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleResetFilters}
          className="btn-clear"
          style={{ marginTop: "16px", width: "100%" }}
        >
          Clear Filters
        </button>
      </section>

      <section
        className="panel"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <div className="panel__header">
          <h3>
            Results ({filteredData.length} of {data.length} entries)
          </h3>
        </div>
        <div
          className="table-container"
          style={{ flex: 1, overflowX: "auto", overflowY: "auto" }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "0.9em",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid var(--accent)",
                  background: "rgba(255, 215, 0, 0.05)",
                }}
              >
                {renderSortableHeader("ID", "unique_ID")}
                {renderSortableHeader("Name", "original_IUPAC_names")}
                {renderSortableHeader("SMILES", "SMILES")}
                {renderSortableHeader("Type", "pka_type")}
                {renderSortableHeader("pKa", "pka_value")}
                {renderSortableHeader("Temp", "T")}
                {renderSortableHeader("Method", "method")}
                {renderSortableHeader("Assessment", "assessment")}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => (
                <tr
                  key={`${row.unique_ID}-${index}`}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background:
                      index % 2 === 0
                        ? "rgba(255,255,255,0.02)"
                        : "transparent",
                  }}
                >
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--accent)",
                      fontWeight: "bold",
                    }}
                  >
                    {row.unique_ID}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      maxWidth: "150px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={row.original_IUPAC_names || ""}
                  >
                    {row.original_IUPAC_names || "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      fontFamily: "monospace",
                      fontSize: "0.85em",
                      maxWidth: "180px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={row.SMILES}
                  >
                    {row.SMILES}
                  </td>
                  <td style={{ padding: "12px" }}>{row.pka_type}</td>
                  <td
                    style={{
                      padding: "12px",
                      fontWeight: "bold",
                      color: "var(--accent-2)",
                    }}
                  >
                    {row.pka_value}
                  </td>
                  <td style={{ padding: "12px", color: "var(--muted)" }}>
                    {row.T || "—"}
                  </td>
                  <td style={{ padding: "12px", fontSize: "0.85em" }}>
                    {row.method}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span
                      className={`assessment-badge ${
                        row.assessment === "Reliable"
                          ? "assessment-reliable"
                          : "assessment-other"
                      }`}
                    >
                      {row.assessment}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                color: "var(--muted)",
              }}
            >
              No results found. Try adjusting your filters.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SearchInterface;
