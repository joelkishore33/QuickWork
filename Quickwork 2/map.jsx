// ============================================================
// QuickWork — draggable SVG campus map + pins + walking routes
// ============================================================
const { useState: mS, useRef: mR, useEffect: mE, useMemo: mM } = React;

// world is 1100 x 760
const ROADS = [
  "M 0 122 C 300 96, 700 150, 1100 112",
  "M 0 596 C 350 632, 720 568, 1100 600",
  "M 330 0 C 312 250, 350 500, 326 760",
  "M 726 0 C 745 240, 712 520, 738 760",
];
const BUILDINGS = [
  [128, 150, 140, 84], [150, 440, 120, 106], [792, 168, 150, 76],
  [884, 330, 104, 120], [428, 642, 212, 68], [668, 648, 118, 58], [60, 320, 90, 70],
];
const TREES = [
  [92, 88, 18], [244, 300, 22], [182, 562, 16], [424, 120, 15], [676, 86, 19],
  [962, 118, 16], [1012, 262, 20], [948, 556, 17], [620, 582, 14], [388, 432, 18],
  [262, 660, 15], [1030, 480, 14],
];

function CampusBackdropSVG() {
  return (
    <svg className="cmp-svg" viewBox="0 0 1100 760" aria-hidden="true">
      <defs>
        <linearGradient id="lawnG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9DC089" /><stop offset="1" stopColor="#83AB6E" />
        </linearGradient>
        <linearGradient id="fieldG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8FBA77" /><stop offset="1" stopColor="#7BA964" />
        </linearGradient>
      </defs>

      {/* soft meadow patches */}
      <ellipse cx="280" cy="210" rx="230" ry="150" fill="#DDE8CE" opacity="0.55" />
      <ellipse cx="900" cy="180" rx="200" ry="130" fill="#E2EBD3" opacity="0.5" />
      <ellipse cx="540" cy="660" rx="320" ry="120" fill="#DCE7CC" opacity="0.45" />

      {/* creek */}
      <path d="M 0 700 C 250 668, 420 732, 640 700 S 920 660, 1100 702" fill="none"
        stroke="#C3DCEA" strokeWidth="16" strokeLinecap="round" opacity="0.8" />

      {/* roads */}
      {ROADS.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke="#E9E2D0" strokeWidth="20" strokeLinecap="round" />
          <path d={d} fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray="12 14" opacity="0.85" className="cmp-dash" />
        </g>
      ))}

      {/* buildings */}
      {BUILDINGS.map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y + 5} width={w} height={h} rx="9" fill="#D8D1BE" />
          <rect x={x} y={y} width={w} height={h} rx="9" fill="#FFFEF9" stroke="#D8D1BE" strokeWidth="1.5" />
        </g>
      ))}

      {/* the Lawn */}
      <rect x="473" y="182" width="154" height="396" rx="14" fill="url(#lawnG)" />
      <rect x="473" y="182" width="154" height="396" rx="14" fill="none" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="3" />
      <line x1="550" y1="196" x2="550" y2="566" stroke="#EDE3CB" strokeWidth="7" strokeLinecap="round" strokeDasharray="1 12" />

      {/* pavilions flanking the lawn */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="432" y={236 + i * 78} width="26" height="38" rx="5" fill="#F4E0C8" stroke="#E2C8A6" strokeWidth="1.5" />
          <rect x="642" y={236 + i * 78} width="26" height="38" rx="5" fill="#F4E0C8" stroke="#E2C8A6" strokeWidth="1.5" />
        </g>
      ))}

      {/* rotunda */}
      <circle cx="550" cy="158" r="34" fill="#FFFDF6" stroke="#232D4B" strokeWidth="3.5" />
      <circle cx="550" cy="158" r="20" fill="none" stroke="#232D4B" strokeWidth="1.5" opacity="0.35" />
      <circle cx="550" cy="158" r="9" fill="#E57200" />
      <rect x="536" y="190" width="28" height="7" rx="3" fill="#D8D1BE" />

      {/* stadium */}
      <ellipse cx="800" cy="470" rx="100" ry="64" fill="#E3EAF4" stroke="#BCCBE0" strokeWidth="3" />
      <ellipse cx="800" cy="470" rx="64" ry="36" fill="url(#fieldG)" />
      <line x1="800" y1="438" x2="800" y2="502" stroke="#FFFFFF" strokeWidth="2" opacity="0.8" />
      <ellipse cx="800" cy="470" rx="10" ry="7" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.8" />

      {/* trees */}
      {TREES.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y + 2} r={r} fill="#8FB573" opacity="0.5" />
          <circle cx={x - r * 0.18} cy={y - r * 0.18} r={r * 0.82} fill="#A8C68C" />
        </g>
      ))}
    </svg>
  );
}

function MapPin({ job, onClick, onHover, dim, delay }) {
  const tier = tierOf(job.price);
  const meta = TIER_META[tier];
  return (
    <button className={`qw-pin${dim ? " is-dim" : ""}`}
      style={{ left: job.x + "%", top: job.y + "%", animationDelay: delay + "ms" }}
      onClick={(e) => { e.stopPropagation(); onClick(job); }}
      onMouseEnter={() => onHover(job)} onMouseLeave={() => onHover(null)} title={job.title}>
      <span className="qw-pin-body" style={{ background: meta.c }}>
        <span className="qw-pin-price">{fmt$(job.price)}</span>
      </span>
      <span className="qw-pin-stem" style={{ borderTopColor: meta.c }} />
      <span className="qw-pin-pulse" style={{ background: meta.c }} />
    </button>
  );
}

const YOU = { x: 50, y: 56 }; // % position of "You" on the lawn
const toWorld = (p) => ({ x: p.x * 11, y: p.y * 7.6 });

function routePath(job) {
  const a = toWorld(YOU), b = toWorld(job);
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const off = Math.min(70, len * 0.22);
  const cx = (a.x + b.x) / 2 - (dy / len) * off;
  const cy = (a.y + b.y) / 2 + (dx / len) * off;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y - 26}`;
}
const walkMin = (job) => {
  const a = toWorld(YOU), b = toWorld(job);
  return Math.max(2, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 95));
};

function CampusMap({ jobs, listers, onPick, filterTiers }) {
  const [pan, setPan] = mS({ x: -60, y: -30 });
  const [drag, setDrag] = mS(null);
  const [zoom, setZoom] = mS(1);
  const [hover, setHover] = mS(null);
  const frame = mR(null);

  const onDown = (e) => {
    const p = e.touches ? e.touches[0] : e;
    setDrag({ sx: p.clientX, sy: p.clientY, px: pan.x, py: pan.y });
  };
  mE(() => {
    if (!drag) return;
    const move = (e) => {
      const p = e.touches ? e.touches[0] : e;
      setPan({ x: drag.px + (p.clientX - drag.sx), y: drag.py + (p.clientY - drag.sy) });
    };
    const up = () => setDrag(null);
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: false }); window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move); window.removeEventListener("touchend", up);
    };
  }, [drag]);

  // scroll / pinch-trackpad zoom
  mE(() => {
    const el = frame.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      setZoom((z) => Math.max(0.6, Math.min(1.9, z - e.deltaY * 0.0016)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const recenter = () => { setPan({ x: -60, y: -30 }); setZoom(1); };
  const visible = jobs.filter((j) => j.status === "approved" && !(j.endsAt && Date.now() >= j.endsAt));

  return (
    <div className="qw-map" ref={frame}>
      <div className={`qw-map-world${drag ? " is-dragging" : ""}`}
        style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transition: drag ? "none" : "transform .22s cubic-bezier(.2,.8,.3,1)" }}
        onMouseDown={onDown} onTouchStart={onDown}>
        <CampusBackdropSVG />

        {/* place labels */}
        <span className="cmp-label" style={{ left: "47%", top: "15%" }}>The Lawn</span>
        <span className="cmp-label" style={{ left: "67.5%", top: "70%" }}>Scott Stadium</span>
        <span className="cmp-label" style={{ left: "42%", top: "86.5%" }}>The Corner</span>
        <span className="cmp-label" style={{ left: "12%", top: "16%" }}>Rugby Rd.</span>

        {/* animated walking route on hover */}
        {hover && !drag && (
          <svg className="route-svg" viewBox="0 0 1100 760">
            <path className="route-path" d={routePath(hover)} />
            <circle className="route-end" cx={toWorld(hover).x} cy={toWorld(hover).y - 26} r="5" />
          </svg>
        )}

        {/* you marker */}
        <div className="you-marker" style={{ left: YOU.x + "%", top: YOU.y + "%" }}>
          <span className="you-dot" />You
        </div>

        {visible.map((j, i) => (
          <MapPin key={j.id} job={j} onClick={onPick} onHover={setHover}
            dim={filterTiers && !filterTiers.includes(tierOf(j.price))} delay={i * 55} />
        ))}

        {/* hover tooltip */}
        {hover && !drag && (
          <div className="pin-tip" style={{ left: hover.x + "%", top: hover.y + "%" }}>
            <b>{hover.title}</b>
            <span>{hover.when} · ~{walkMin(hover)} min walk</span>
          </div>
        )}
      </div>

      {/* controls */}
      <div className="qw-map-ctrls">
        <button onClick={() => setZoom((z) => Math.min(1.9, z + 0.2))}>+</button>
        <button onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}>−</button>
        <button onClick={recenter} title="Recenter">⌖</button>
      </div>
      <div className="qw-map-hint">drag to explore · scroll to zoom</div>
    </div>
  );
}

Object.assign(window, { CampusMap, MapPin });
