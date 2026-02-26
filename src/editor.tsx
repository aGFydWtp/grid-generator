import { useState, useCallback, useMemo, useRef } from "hono/jsx";

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateAreaColor(index) {
  const goldenAngle = 137.508;
  const hue = (index * goldenAngle) % 360;
  return {
    bg: hslToHex(hue, 45, 82),
    border: hslToHex(hue, 40, 62),
    text: hslToHex(hue, 35, 30),
  };
}

const DEFAULT_ROWS = 3;
const DEFAULT_COLS = 3;

function buildInitialGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill("."));
}

export function CSSGridGenerator() {
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [grid, setGrid] = useState(() => buildInitialGrid(DEFAULT_ROWS, DEFAULT_COLS));
  const [areas, setAreas] = useState(["header", "sidebar", "main", "footer"]);
  const [newAreaName, setNewAreaName] = useState("");
  const [selectedArea, setSelectedArea] = useState("header");
  const [gap, setGap] = useState(12);
  const [isPainting, setIsPainting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rowSizes, setRowSizes] = useState(() => Array(DEFAULT_ROWS).fill("1fr"));
  const [colSizes, setColSizes] = useState(() => Array(DEFAULT_COLS).fill("1fr"));
  const gridRef = useRef(null);

  const areaColorMap = useMemo(() => {
    const map = {};
    areas.forEach((a, i) => {
      map[a] = generateAreaColor(i);
    });
    return map;
  }, [areas]);

  const resizeGrid = useCallback((newRows, newCols) => {
    setGrid((prev) => {
      const next = [];
      for (let r = 0; r < newRows; r++) {
        next[r] = [];
        for (let c = 0; c < newCols; c++) {
          next[r][c] = prev[r]?.[c] ?? ".";
        }
      }
      return next;
    });
    setRowSizes((prev) => {
      const next = [...prev];
      while (next.length < newRows) next.push("1fr");
      return next.slice(0, newRows);
    });
    setColSizes((prev) => {
      const next = [...prev];
      while (next.length < newCols) next.push("1fr");
      return next.slice(0, newCols);
    });
    setRows(newRows);
    setCols(newCols);
  }, []);

  const paintCell = useCallback((r, c) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = next[r][c] === selectedArea ? "." : selectedArea;
      return next;
    });
  }, [selectedArea]);

  const handleMouseDown = (r, c) => {
    setIsPainting(true);
    paintCell(r, c);
  };

  const handleMouseEnter = (r, c) => {
    if (isPainting) paintCell(r, c);
  };

  const handleMouseUp = () => setIsPainting(false);

  const maxAreas = rows * cols;

  const addArea = () => {
    const name = newAreaName.trim().replace(/\s+/g, "-");
    if (name && !areas.includes(name) && /^[a-zA-Z_][\w-]*$/.test(name) && areas.length < maxAreas) {
      setAreas([...areas, name]);
      setSelectedArea(name);
      setNewAreaName("");
    }
  };

  const removeArea = (name) => {
    setAreas(areas.filter((a) => a !== name));
    setGrid((prev) => prev.map((row) => row.map((cell) => (cell === name ? "." : cell))));
    if (selectedArea === name) setSelectedArea(areas[0] === name ? areas[1] || "" : areas[0]);
  };

  const clearGrid = () => setGrid(buildInitialGrid(rows, cols));

  const templateAreas = grid.map((row) => `"${row.join(" ")}"`).join("\n    ");
  const templateRows = rowSizes.join(" ");
  const templateCols = colSizes.join(" ");

  const usedAreas = new Set(grid.flat().filter((c) => c !== "."));

  const generatedCSS = `.grid-container {
  display: grid;
  grid-template-areas:
    ${templateAreas};
  grid-template-rows: ${templateRows};
  grid-template-columns: ${templateCols};
  gap: ${gap}px;
}
${[...usedAreas].map((a) => `\n.${a} {\n  grid-area: ${a};\n}`).join("\n")}`;

  const copyCSS = () => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = generatedCSS;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        navigator.clipboard.writeText(generatedCSS).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      } catch {}
    }
  };

  const isValidGrid = useMemo(() => {
    for (const area of usedAreas) {
      const cells = [];
      grid.forEach((row, r) => row.forEach((cell, c) => { if (cell === area) cells.push([r, c]); }));
      if (cells.length === 0) continue;
      const minR = Math.min(...cells.map(([r]) => r));
      const maxR = Math.max(...cells.map(([r]) => r));
      const minC = Math.min(...cells.map(([, c]) => c));
      const maxC = Math.max(...cells.map(([, c]) => c));
      const expected = (maxR - minR + 1) * (maxC - minC + 1);
      if (cells.length !== expected) return false;
    }
    return true;
  }, [grid, usedAreas]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1C1917",
        color: "#E7E5E4",
        fontFamily: "'IBM Plex Mono', 'Menlo', monospace",
        userSelect: "none",
      }}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Fraunces:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #292524; }
        ::-webkit-scrollbar-thumb { background: #57534E; border-radius: 3px; }
        input:focus, button:focus-visible { outline: 2px solid #D97706; outline-offset: 1px; }
      `}</style>

      {/* Header */}
      <header style={{
        padding: "20px 28px",
        borderBottom: "1px solid #292524",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 22,
            fontWeight: 700,
            color: "#FBBF24",
            letterSpacing: "-0.02em",
          }}>
            ⊞ Grid Architect
          </h1>
          <span style={{ fontSize: 11, color: "#78716C", letterSpacing: "0.05em" }}>
            CSS GRID GENERATOR
          </span>
        </div>
        {!isValidGrid && (
          <span style={{
            fontSize: 11,
            color: "#EF4444",
            background: "#451A1A",
            padding: "4px 10px",
            borderRadius: 4,
          }}>
            ⚠ エリアは矩形である必要があります
          </span>
        )}
      </header>

      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 65px)" }}>
        {/* ── EDITOR SECTION ── */}
        <div style={{ flex: "1 1 55%", padding: "20px 28px", overflow: "auto", borderBottom: "2px solid #292524" }}>
          {/* Controls Bar */}
          <div style={{
            display: "flex",
            gap: 16,
            alignItems: "flex-end",
            flexWrap: "wrap",
            marginBottom: 16,
          }}>
            <label style={labelStyle}>
              <span style={labelTextStyle}>行</span>
              <input type="number" min={1} max={48} value={rows}
                onChange={(e) => resizeGrid(Math.max(1, Math.min(48, +e.target.value)), cols)}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              <span style={labelTextStyle}>列</span>
              <input type="number" min={1} max={48} value={cols}
                onChange={(e) => resizeGrid(rows, Math.max(1, Math.min(48, +e.target.value)))}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              <span style={labelTextStyle}>Gap</span>
              <input type="number" min={0} max={64} value={gap}
                onChange={(e) => setGap(Math.max(0, +e.target.value))}
                style={{ ...inputStyle, width: 64 }}
              />
            </label>
            <button onClick={clearGrid} style={btnSecondary}>クリア</button>
          </div>

          {/* Size editors */}
          <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ ...labelTextStyle, marginRight: 4 }}>行サイズ:</span>
              {rowSizes.map((s, i) => (
                <input key={`r${i}`} value={s}
                  onChange={(e) => { const n = [...rowSizes]; n[i] = e.target.value; setRowSizes(n); }}
                  style={{ ...inputStyle, width: 56, fontSize: 11 }}
                  placeholder="1fr"
                />
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ ...labelTextStyle, marginRight: 4 }}>列サイズ:</span>
              {colSizes.map((s, i) => (
                <input key={`c${i}`} value={s}
                  onChange={(e) => { const n = [...colSizes]; n[i] = e.target.value; setColSizes(n); }}
                  style={{ ...inputStyle, width: 56, fontSize: 11 }}
                  placeholder="1fr"
                />
              ))}
            </div>
          </div>

          {/* Area palette */}
          <div style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 16,
          }}>
            <span style={{ ...labelTextStyle, marginRight: 2 }}>エリア ({areas.length}/{maxAreas}):</span>
            {areas.map((a) => {
              const c = areaColorMap[a];
              const active = selectedArea === a;
              return (
                <div key={a} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                }}>
                  <button
                    onClick={() => setSelectedArea(a)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "4px 0 0 4px",
                      border: `2px solid ${active ? "#FBBF24" : c.border}`,
                      background: active ? c.bg : "transparent",
                      color: active ? c.text : c.bg,
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {a}
                  </button>
                  <button
                    onClick={() => removeArea(a)}
                    style={{
                      padding: "5px 6px",
                      borderRadius: "0 4px 4px 0",
                      border: `2px solid ${active ? "#FBBF24" : c.border}`,
                      borderLeft: "none",
                      background: "transparent",
                      color: "#78716C",
                      fontSize: 11,
                      fontFamily: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 0, opacity: areas.length >= maxAreas ? 0.4 : 1 }}>
              <input
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addArea()}
                placeholder={areas.length >= maxAreas ? "上限に達しました" : "新しいエリア名"}
                disabled={areas.length >= maxAreas}
                style={{
                  ...inputStyle,
                  width: 120,
                  borderRadius: "4px 0 0 4px",
                  fontSize: 11,
                }}
              />
              <button onClick={addArea} disabled={areas.length >= maxAreas} style={{
                ...btnSecondary,
                borderRadius: "0 4px 4px 0",
                borderLeft: "none",
                padding: "5px 10px",
              }}>+</button>
            </div>
          </div>

          {/* Interactive Grid */}
          <div ref={gridRef} style={{
            display: "inline-grid",
            gridTemplateColumns: `repeat(${cols}, minmax(60px, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(48px, 1fr))`,
            gap: 3,
            background: "#292524",
            padding: 3,
            borderRadius: 8,
            border: "1px solid #3F3A36",
            width: "100%",
            maxWidth: Math.max(400, cols * 90),
          }}>
            {grid.flatMap((row, r) =>
              row.map((cell, c) => {
                const areaColor = cell !== "." ? areaColorMap[cell] : null;
                return (
                  <div
                    key={`${r}-${c}`}
                    onMouseDown={() => handleMouseDown(r, c)}
                    onMouseEnter={() => handleMouseEnter(r, c)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 4,
                      border: areaColor ? `2px solid ${areaColor.border}` : "2px dashed #44403C",
                      background: areaColor ? areaColor.bg : "#1C1917",
                      color: areaColor ? areaColor.text : "#57534E",
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      transition: "all 0.1s",
                      minHeight: 48,
                    }}
                  >
                    {cell === "." ? "·" : cell}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── PREVIEW SECTION ── */}
        <div style={{ flex: "1 1 45%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{
            display: "flex",
            borderBottom: "1px solid #292524",
            padding: "0 28px",
          }}>
            <span style={{
              padding: "10px 0",
              fontSize: 11,
              fontWeight: 600,
              color: "#A8A29E",
              letterSpacing: "0.08em",
              flex: 1,
            }}>
              生成コード
            </span>
            <span style={{
              padding: "10px 0",
              fontSize: 11,
              fontWeight: 600,
              color: "#A8A29E",
              letterSpacing: "0.08em",
              flex: 1,
              textAlign: "center",
            }}>
              ライブプレビュー
            </span>
          </div>

          <div style={{
            display: "flex",
            flex: 1,
            overflow: "hidden",
          }}>
            {/* Code panel */}
            <div style={{
              flex: 1,
              padding: "16px 28px",
              overflow: "auto",
              borderRight: "1px solid #292524",
              position: "relative",
            }}>
              <button onClick={copyCSS} style={{
                position: "sticky",
                top: 0,
                float: "right",
                ...btnSecondary,
                fontSize: 11,
                padding: "4px 10px",
                background: copied ? "#166534" : undefined,
                borderColor: copied ? "#22C55E" : undefined,
                color: copied ? "#BBF7D0" : undefined,
              }}>
                {copied ? "✓ コピー済" : "コピー"}
              </button>
              <pre style={{
                fontSize: 12,
                lineHeight: 1.7,
                color: "#D6D3D1",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}>
                <code>{highlightCSS(generatedCSS, areaColorMap)}</code>
              </pre>
            </div>

            {/* Live preview */}
            <div style={{
              flex: 1,
              padding: 16,
              overflow: "auto",
              display: "flex",
              alignItems: "stretch",
            }}>
              <div style={{
                flex: 1,
                display: "grid",
                gridTemplateAreas: grid.map((row) => `"${row.join(" ")}"`).join(" "),
                gridTemplateRows: templateRows,
                gridTemplateColumns: templateCols,
                gap: `${gap}px`,
                minHeight: 200,
              }}>
                {[...usedAreas].map((a) => {
                  const c = areaColorMap[a];
                  return (
                    <div key={a} style={{
                      gridArea: a,
                      background: c?.bg || "#333",
                      border: `2px solid ${c?.border || "#555"}`,
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: c?.text || "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "inherit",
                      padding: 8,
                    }}>
                      .{a}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function highlightCSS(css, colorMap) {
  const parts = [];
  let i = 0;
  const lines = css.split("\n");
  return lines.map((line, li) => {
    const elements = [];
    // Highlight area names in quotes
    const quoteRe = /"([^"]+)"/g;
    let match;
    let last = 0;
    while ((match = quoteRe.exec(line)) !== null) {
      elements.push(
        <span key={`${li}-${last}`} style={{ color: "#78716C" }}>
          {line.slice(last, match.index)}
        </span>
      );
      const inner = match[1].split(" ").map((word, wi) => {
        const c = colorMap[word];
        return (
          <span key={wi} style={{ color: c ? c.bg : "#78716C" }}>
            {word}{" "}
          </span>
        );
      });
      elements.push(
        <span key={`${li}-q-${match.index}`}>
          <span style={{ color: "#78716C" }}>"</span>
          {inner}
          <span style={{ color: "#78716C" }}>"</span>
        </span>
      );
      last = match.index + match[0].length;
    }
    if (elements.length > 0) {
      elements.push(
        <span key={`${li}-end`} style={{ color: "#78716C" }}>
          {line.slice(last)}
        </span>
      );
    }
    // Highlight property names
    if (elements.length === 0) {
      const propRe = /^(\s*)([\w-]+)(:)/;
      const pm = propRe.exec(line);
      if (pm) {
        elements.push(
          <span key={`${li}-ws`}>{pm[1]}</span>,
          <span key={`${li}-prop`} style={{ color: "#FBBF24" }}>{pm[2]}</span>,
          <span key={`${li}-col`} style={{ color: "#78716C" }}>:</span>,
          <span key={`${li}-val`} style={{ color: "#D6D3D1" }}>
            {line.slice(pm[0].length)}
          </span>
        );
      } else if (line.includes("{") || line.includes("}")) {
        const selectorColor = line.startsWith(".") ? "#87CEEB" : "#D6D3D1";
        elements.push(
          <span key={`${li}-sel`} style={{ color: selectorColor }}>{line}</span>
        );
      } else {
        elements.push(<span key={`${li}-txt`}>{line}</span>);
      }
    }
    return (
      <span key={li}>
        {elements}
        {"\n"}
      </span>
    );
  });
}

const labelStyle = { display: "flex", flexDirection: "column", gap: 4 };
const labelTextStyle = { fontSize: 10, color: "#A8A29E", letterSpacing: "0.06em", textTransform: "uppercase" };
const inputStyle = {
  width: 52,
  padding: "5px 8px",
  borderRadius: 4,
  border: "1px solid #44403C",
  background: "#292524",
  color: "#E7E5E4",
  fontSize: 13,
  fontFamily: "inherit",
};
const btnSecondary = {
  padding: "5px 14px",
  borderRadius: 4,
  border: "1px solid #44403C",
  background: "#292524",
  color: "#A8A29E",
  fontSize: 12,
  fontFamily: "inherit",
  cursor: "pointer",
  fontWeight: 500,
};
