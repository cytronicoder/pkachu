import { useEffect, useMemo, useState } from "react";

const fieldWeights = {
  original_IUPAC_names: 100,
  SMILES: 80,
  pka_type: 60,
  unique_ID: 40,
  InChI: 30,
  pka_value: 20,
};

const parsePkaFilter = (rawValue) => {
  if (!rawValue) return null;
  const trimmed = rawValue.trim();
  const rangeMatch = trimmed.match(
    /^(-?\d*\.?\d+)\s*(?:-|\.\.)\s*(-?\d*\.?\d+)$/
  );
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    if (!isNaN(min) && !isNaN(max)) {
      return { min: Math.min(min, max), max: Math.max(min, max) };
    }
  }

  const comparisonMatch = trimmed.match(/^([<>]=?)\s*(-?\d*\.?\d+)$/);
  if (comparisonMatch) {
    const operator = comparisonMatch[1];
    const value = parseFloat(comparisonMatch[2]);
    if (!isNaN(value)) {
      return {
        min: operator.includes(">") ? value : null,
        max: operator.includes("<") ? value : null,
        operator,
      };
    }
  }

  const exactValue = parseFloat(trimmed);
  if (!isNaN(exactValue)) {
    return { min: exactValue, max: exactValue, operator: "=" };
  }

  return null;
};

const parseSearchQuery = (query) => {
  const rawTokens = query.trim().split(/\s+/).filter(Boolean);
  const textTokens = [];
  const filters = {
    type: null,
    assessment: null,
    id: null,
    pka: null,
  };

  rawTokens.forEach((token) => {
    const match = token.match(/^([A-Za-z_][A-Za-z0-9_]*):(.*)$/);
    if (match) {
      const key = match[1].toLowerCase();
      const value = match[2].trim();

      if (key === "type" && value) {
        filters.type = value;
        return;
      }
      if (key === "assessment" && value) {
        filters.assessment = value;
        return;
      }
      if ((key === "id" || key === "unique_id") && value) {
        filters.id = value;
        return;
      }
      if (key === "pka" && value) {
        filters.pka = parsePkaFilter(value);
        return;
      }
    }

    textTokens.push(token);
  });

  const numericHints = Array.from(query.matchAll(/\b-?\d*\.?\d+\b/g), (match) =>
    parseFloat(match[0])
  ).filter((value) => !isNaN(value));

  return {
    textTokens: textTokens.map((token) => token.toLowerCase()),
    filters,
    numericHints,
  };
};

const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const calculateSearchScore = (
  row,
  textTokens,
  numericHints,
  matchMode,
  options = {}
) => {
  const { preferExact = true } = options;

  if (!textTokens.length) return 0;

  let totalScore = 0;
  let matchedTokens = 0;

  textTokens.forEach((token) => {
    let tokenMatched = false;

    Object.entries(fieldWeights).forEach(([field, baseWeight]) => {
      const fieldValue = String(row[field] || "").toLowerCase();

      if (fieldValue.includes(token)) {
        tokenMatched = true;
        let fieldScore = baseWeight;

        if (fieldValue === token) {
          fieldScore *= 5;
          if (preferExact) totalScore += 1000;
        } else {
          const baseName = fieldValue
            .split(/[;,()]/)[0]
            .replace(/-$/, "")
            .trim();
          if (baseName === token) {
            const nextChar = fieldValue[token.length] || "";
            const isModified =
              fieldValue.length > token.length &&
              /[ ,\-\/\(\)\[]/.test(
                nextChar + fieldValue.slice(token.length, token.length + 2)
              );
            if (isModified) {
              fieldScore *= 2;
              if (preferExact) totalScore += 100;
            } else {
              fieldScore *= 3.5;
              if (preferExact) totalScore += 500;
            }
          }

          if (fieldValue.startsWith(token)) {
            const nextChar = fieldValue[token.length] || "";
            if (nextChar === "," || nextChar === "-" || nextChar === ")") {
              fieldScore *= 1.3;
            } else {
              fieldScore *= 2;
            }
          }

          const wordRe = new RegExp(
            `(^|[^a-z0-9])${escapeRegExp(token)}($|[^a-z0-9])`
          );
          if (wordRe.test(fieldValue)) {
            fieldScore *= 1.5;
          }
        }

        const lengthRatio = token.length / fieldValue.length;
        if (lengthRatio > 0.8) {
          fieldScore *= 1.5;
        } else if (lengthRatio > 0.5) {
          fieldScore *= 1.2;
        }

        const matchIndex = fieldValue.indexOf(token);
        if (matchIndex === 0) {
          fieldScore *= 1.3;
        } else if (matchIndex < fieldValue.length * 0.2) {
          fieldScore *= 1.1;
        }

        totalScore += fieldScore;
      }
    });

    if (tokenMatched) {
      matchedTokens += 1;
    }
  });

  if (matchMode === "all" && matchedTokens !== textTokens.length) {
    return 0;
  }
  if (matchMode === "any" && matchedTokens === 0) {
    return 0;
  }

  const matchedFields = Object.keys(fieldWeights).filter((field) =>
    textTokens.some((token) =>
      String(row[field] || "")
        .toLowerCase()
        .includes(token)
    )
  );
  if (matchedFields.length > 1) {
    totalScore *= 1 + matchedFields.length * 0.1;
  }

  numericHints.forEach((value) => {
    const pkaValue = parseFloat(row.pka_value);
    if (!isNaN(pkaValue)) {
      if (Math.abs(pkaValue - value) < 0.1) {
        totalScore += 200;
      } else if (Math.abs(pkaValue - value) < 1) {
        totalScore += 100;
      }
    }
  });

  return totalScore;
};

const DEFAULT_RESULTS_LIMIT = 100;

const SearchInterface = ({ data, loading }) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [limit, setLimit] = useState(DEFAULT_RESULTS_LIMIT);
  const [sortBy, setSortBy] = useState("pka_value");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterType, setFilterType] = useState("all");
  const [minPka, setMinPka] = useState("");
  const [maxPka, setMaxPka] = useState("");
  const [assessment, setAssessment] = useState("all");
  const [matchMode, setMatchMode] = useState("all");
  const [preferExact, setPreferExact] = useState(true);
  const [rangeError, setRangeError] = useState("");
  const [notification, setNotification] = useState("");

  const parsedQuery = useMemo(
    () => parseSearchQuery(debouncedQuery),
    [debouncedQuery]
  );

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  useEffect(() => {
    if (minPka && maxPka) {
      const min = parseFloat(minPka);
      const max = parseFloat(maxPka);
      if (!isNaN(min) && !isNaN(max) && min > max) {
        setRangeError("Minimum pKa must be less than or equal to maximum pKa.");
      } else {
        setRangeError("");
      }
    } else {
      setRangeError("");
    }
  }, [minPka, maxPka]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const { matches, displayedResults } = useMemo(() => {
    let results = data;
    const { textTokens, filters, numericHints } = parsedQuery;
    const hasTextQuery = textTokens.length > 0;

    if (hasTextQuery) {
      results = data.map((row) => ({
        ...row,
        searchScore: calculateSearchScore(
          row,
          textTokens,
          numericHints,
          matchMode,
          { preferExact }
        ),
      }));
    }

    if (hasTextQuery) {
      results = results.filter((row) => row.searchScore > 0);
    }

    if (filters.type) {
      results = results.filter(
        (row) =>
          String(row.pka_type || "").toLowerCase() ===
          filters.type.toLowerCase()
      );
    }

    if (filters.assessment) {
      results = results.filter(
        (row) =>
          String(row.assessment || "").toLowerCase() ===
          filters.assessment.toLowerCase()
      );
    }

    if (filters.id) {
      results = results.filter(
        (row) =>
          String(row.unique_ID || "").toLowerCase() === filters.id.toLowerCase()
      );
    }

    if (filters.pka) {
      results = results.filter((row) => {
        const value = parseFloat(row.pka_value);
        if (isNaN(value)) return false;
        const { min, max, operator } = filters.pka;
        if (operator === ">") return value > min;
        if (operator === ">=") return value >= min;
        if (operator === "<") return value < max;
        if (operator === "<=") return value <= max;
        if (min !== null && max !== null) return value >= min && value <= max;
        if (min !== null) return value >= min;
        if (max !== null) return value <= max;
        return true;
      });
    }

    if (filterType !== "all") {
      results = results.filter((row) => row.pka_type === filterType);
    }

    if (!rangeError) {
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
    }

    if (assessment !== "all") {
      results = results.filter((row) => row.assessment === assessment);
    }

    results.sort((a, b) => {
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

    return {
      matches: results,
      displayedResults: results.slice(0, limit),
    };
  }, [
    data,
    parsedQuery,
    limit,
    sortBy,
    sortOrder,
    filterType,
    minPka,
    maxPka,
    assessment,
    rangeError,
    matchMode,
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
    const currentSort = sortBy === columnKey ? sortOrder : null;

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
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(columnKey);
      setSortOrder("asc");
    }
  };

  const handleResetFilters = () => {
    setQuery("");
    setMinPka("");
    setMaxPka("");
    setFilterType("all");
    setAssessment("all");
    setSortBy("pka_value");
    setSortOrder("asc");
    setMatchMode("all");
    setPreferExact(true);
    setRangeError("");
    setNotification("");
  };

  const handleExportCSV = () => {
    if (matches.length === 0) {
      setNotification("No data to export");
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
      ...matches.map((row) =>
        headers
          .map((header) => {
            const value = row[header] || "";
            let stringValue = String(value);
            if (stringValue === "NaN") stringValue = "";
            let escaped = stringValue;
            if (
              stringValue.includes(",") ||
              stringValue.includes('"') ||
              stringValue.includes("\n")
            ) {
              escaped = `"${stringValue.replace(/"/g, '""')}"`;
            }
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
    if (matches.length === 0) {
      setNotification("No data to export");
      return;
    }

    const blob = new Blob([JSON.stringify(matches, null, 2)], {
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
                Use filters like type:acid, assessment:Reliable, pka:4.7-4.9 or
                pka:&gt;=4.5. Search is debounced for performance.
                <span
                  style={{
                    display: "block",
                    color: "var(--muted)",
                    marginTop: "6px",
                    fontSize: "0.85rem",
                  }}
                >
                  Note: Only these keys are recognized as filters —{" "}
                  <code>type</code>, <code>assessment</code>, <code>id</code>,{" "}
                  <code>unique_id</code>, and <code>pka</code>. Other
                  colon-separated tokens are searched literally.
                </span>                <span
                  style={{
                    display: "block",
                    color: "var(--muted)",
                    marginTop: "6px",
                    fontSize: "0.85rem",
                  }}
                >
                  Field filters are always applied together (logical AND) and are not affected by the Match Mode setting.
                </span>                {preferExact && (
                  <span
                    style={{
                      display: "block",
                      color: "var(--muted)",
                      marginTop: "6px",
                      fontSize: "0.85rem",
                    }}
                  >
                    🔎 Exact-name prioritization is ON
                  </span>
                )}
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
            <label htmlFor="match-mode" className="field">
              <span id="match-mode-label">Match Mode</span>
              <select
                id="match-mode"
                value={matchMode}
                onChange={(e) => setMatchMode(e.target.value)}
                aria-label="Match mode for search tokens"
                aria-describedby="match-mode-label"
              >
                <option value="all">Match all terms (AND)</option>
                <option value="any">Match any term (OR)</option>
              </select>
              <div style={{marginTop:'6px'}}>
                <small style={{color:'var(--muted)'}}>Note: Match Mode only affects free-text search tokens; field filters (type, assessment, id, unique_id, pka) are always combined with AND.</small>
              </div>
            </label>

            <label
              className="field"
              title="When enabled, results with exact or base-name matches (e.g., 'acetic acid') will be ranked higher"
            >
              <span>Prefer exact names</span>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <input
                  id="prefer-exact"
                  type="checkbox"
                  checked={preferExact}
                  onChange={(e) => setPreferExact(e.target.checked)}
                  aria-label="Prioritize exact compound names"
                />
                <label
                  htmlFor="prefer-exact"
                  style={{ fontSize: "0.9rem", color: "var(--muted)" }}
                >
                  On
                </label>
              </div>
            </label>

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
              {rangeError && (
                <p
                  style={{
                    color: "var(--accent-3)",
                    fontSize: "0.875rem",
                    marginTop: "4px",
                    marginBottom: "0",
                  }}
                >
                  {rangeError}
                </p>
              )}
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
              <span id="sort-order-label">Order</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                aria-label="Sort order"
                aria-describedby="sort-order-label"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </label>

            <label htmlFor="results-per-page" className="field">
              <span id="results-per-page-label">Rows Shown</span>
              <select
                id="results-per-page"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                aria-label="Results per page"
                aria-describedby="results-per-page-label"
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
                disabled={matches.length === 0}
              >
                Export CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="btn btn-secondary"
                style={{ width: "100%" }}
                disabled={matches.length === 0}
              >
                Export JSON
              </button>
            </div>
            {notification && (
              <p
                style={{
                  marginTop: "8px",
                  fontSize: "0.875rem",
                  color: "var(--accent-3)",
                  textAlign: "center",
                }}
              >
                {notification}
              </p>
            )}
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
            Showing {displayedResults.length} of {matches.length} matches (out
            of {data.length} entries)
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
              {displayedResults.map((row, index) => (
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
          {matches.length === 0 && (
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
