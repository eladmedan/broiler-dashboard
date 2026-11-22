import { useEffect, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './TrioRightColumn.css';

/* ------------------------------------------------------------------ */
/* Mock data (defaults follow the Figma design; silos vary per PRD)    */
/* ------------------------------------------------------------------ */

export type SiloReading = {
  name: string;
  /** Fill level 0–100; null when the silo cannot be read. */
  pct: number | null;
  /** Current feed quantity in kg. */
  kg: number | null;
};

export type DailyMetric = {
  total: number | null;
  unit: string;
  /** Change vs. yesterday, percent. */
  gainPct: number;
  alarm?: 'high' | 'low' | 'under' | 'over' | null;
};

export type PressureReading = {
  /** Drinker line pressure in cm water column; null = read failure. */
  cm: number | null;
  alarm?: 'low' | 'high' | 'emergency' | null;
};

export type BirdGroup = {
  label: 'Female' | 'Male';
  count: number;
  /** Average weight in kg; null when the weight cannot be obtained. */
  avgKg: number | null;
  /** Mortality change vs. yesterday, percent. */
  mortalityPct: number;
};

export const MOCK_SILOS: SiloReading[] = [
  { name: 'Silo 1', pct: 62, kg: 6200 },
  { name: 'Silo 2', pct: 38, kg: 3800 },
  { name: 'Silo 3', pct: 15, kg: 1500 },
  { name: 'Silo 4', pct: null, kg: null },
];
export const MOCK_WATER: DailyMetric = { total: 1621, unit: 'L', gainPct: -5, alarm: null };
export const MOCK_FEED: DailyMetric = { total: 1327, unit: 'Kg', gainPct: 5, alarm: null };
export const MOCK_PRESSURE: PressureReading = { cm: 8.5, alarm: null };
export const MOCK_FCR = 1.3;
/** Water/feed ratio as reported by the controller (null = not available). */
export const MOCK_WATER_FEED_RATIO: number | null = 1.3;
export const MOCK_BIRDS: BirdGroup[] = [
  { label: 'Female', count: 32000, avgKg: 2.8, mortalityPct: 5 },
  { label: 'Male', count: 29500, avgKg: 3.2, mortalityPct: -5 },
];

const SILO_WARN_PCT = 20;
const PRESSURE_MAX_CM = 60;
const PRESSURE_STEP_CM = 5;
const TOAST_MS = 5000;

type Widget = 'silos' | 'water' | 'feed' | 'pressure' | 'birds';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const fmtInt = (n: number) => n.toLocaleString('en-US');
const fmtTons = (kg: number) => (kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${Math.round(kg)}kg`);
const fmtPct = (p: number) => `${p > 0 ? '+' : p < 0 ? '-' : ''}${Math.abs(p)}%`;

function clickable(fn: () => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick: fn,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fn();
      }
    },
  };
}

/** Big number with a smaller unit (58 / 40 px in Figma). */
function BigValue({ value, unit, error }: { value: string | null; unit: string; error?: boolean }) {
  return (
    <div className="trc-big">
      {error || value === null ? (
        <span className="trc-err">ERR</span>
      ) : (
        <>
          <b>{value}</b>
          <i>{unit}</i>
        </>
      )}
    </div>
  );
}

function TrendIcon({ up }: { up: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 19 19" aria-hidden="true">
      <circle cx="9.5" cy="9.5" r="9.5" fill="#fff" fillOpacity="0.28" />
      {up ? (
        <path d="M6 13L13 6M7.5 6H13V11.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 6L13 13M13 7.5V13H7.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

/** Red/green change chip. `goodWhenUp` decides the color (mortality is good when it goes down). */
function ChangeChip({ pct, goodWhenUp }: { pct: number; goodWhenUp: boolean }) {
  const good = pct === 0 ? true : (pct > 0) === goodWhenUp;
  return (
    <div className={`trc-chip ${good ? 'trc-chip--good' : 'trc-chip--bad'}`}>
      <TrendIcon up={pct >= 0} />
      <span>{fmtPct(pct)}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Silo                                                                */
/* ------------------------------------------------------------------ */

// Geometry traced from Figma node 7891:35403 (106.34 × 188.62 frame).
const VESSEL = 'M6 32 L40 23.5 H66 L101 32 V164.4 L53.5 194.4 L6 164.4 Z';
const INNER = 'M11 36.5 L40.5 28.5 H65.5 L96 36.5 V160.6 L53.5 187.5 L11 160.6 Z';
const LEVEL_TOP = 36; // y at 100 %
const LEVEL_BOTTOM = 187.5; // y at 0 % (bottom point of the cone)

function Silo({ silo, idx }: { silo: SiloReading; idx: number }) {
  const error = silo.pct === null || silo.kg === null;
  const pct = error ? 0 : Math.max(0, Math.min(100, silo.pct as number));
  const empty = !error && pct === 0;
  const warn = !error && !empty && pct < SILO_WARN_PCT;
  const state = error ? 'error' : empty ? 'empty' : warn ? 'warn' : 'ok';
  const clipId = `trc-silo-clip-${idx}`;
  const levelY = LEVEL_BOTTOM - (pct / 100) * (LEVEL_BOTTOM - LEVEL_TOP);

  const vesselFill = error ? '#f4f5f5' : warn ? 'var(--yellow-100, #fef9d5)' : '#e8e9ea';
  const vesselStroke = error ? 'var(--red-500, #ec4848)' : 'none';
  const levelFill = warn ? 'var(--yellow-700, #c48f07)' : '#b6b7b8';

  return (
    <div className={`trc-silo trc-silo--${state}`} aria-label={`${silo.name}: ${error ? 'error, no reading' : `${pct}%`}`}>
      <svg width="107" height="197" viewBox="0 0 107 197" aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y={levelY} width="107" height={197 - levelY} />
          </clipPath>
        </defs>
        <path d={VESSEL} fill={vesselFill} stroke={vesselStroke} strokeWidth={error ? 1.5 : 0} strokeDasharray={error ? '4 3' : undefined} />
        <path d={INNER} fill="none" stroke={error ? 'none' : warn ? '#f3e7b0' : '#e2e3e4'} strokeWidth="1.5" />
        {!error && !empty && <path d={INNER} fill={levelFill} fillOpacity={warn ? 0.55 : 1} clipPath={`url(#${clipId})`} />}
      </svg>
      <div className="trc-silo-name">{silo.name}</div>
      <div className="trc-silo-chip">
        {error ? (
          <>
            <b>ERR</b>
            <span>No reading</span>
          </>
        ) : empty ? (
          <>
            <b>0%</b>
            <span>Empty</span>
          </>
        ) : (
          <>
            <b>{pct}%</b>
            <span>{fmtTons(silo.kg as number)}</span>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Water / feed                                                        */
/* ------------------------------------------------------------------ */

const ALARM_TEXT: Record<string, string> = { high: 'High alarm', low: 'Low alarm', under: 'Under alarm', over: 'Over alarm' };

function MetricCard({
  label,
  metric,
  area,
  onClick,
}: {
  label: string;
  metric: DailyMetric;
  area: ReactNode;
  onClick: () => void;
}) {
  const err = metric.total === null;
  return (
    <div className="trc-metric trc-click" {...clickable(onClick)}>
      <div className="trc-metric-top">
        <span className="trc-h18">{label}</span>
        {metric.alarm && <span className="trc-alarm trc-alarm--red">{ALARM_TEXT[metric.alarm]}</span>}
      </div>
      <BigValue value={err ? null : fmtInt(metric.total as number).replace(',', '')} unit={metric.unit} error={err} />
      <div className="trc-trend">
        {area}
        {!err && (
          <div className="trc-trend-sum">
            <ChangeChip pct={metric.gainPct} goodWhenUp />
            <span className="trc-cmp">vs. Yesterday</span>
          </div>
        )}
      </div>
    </div>
  );
}

function AreaShape({ id, d }: { id: string; d: string }) {
  return (
    <svg width="188" height="75" viewBox="0 0 188 75" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9cccd" />
          <stop offset="1" stopColor="#c9cccd" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
    </svg>
  );
}

const WATER_AREA = 'M0 10 C26 4 44 4 70 13 C96 22 116 21 140 9 C158 0 174 -1 188 3 V75 H0 Z';
const FEED_AREA = 'M0 34 L93.5 0.5 L188 34.6 V75 H0 Z';

function Pressure({ p, onClick }: { p: PressureReading; onClick: () => void }) {
  const err = p.cm === null;
  // Scale: 0 cm at y=201.65, 60 cm at y=55.65 inside the tube (panel y 250 / 104).
  const y0 = 201.65;
  const y60 = 55.65;
  const yFor = (cm: number) => y0 - (Math.max(0, Math.min(PRESSURE_MAX_CM, cm)) / PRESSURE_MAX_CM) * (y0 - y60);
  const ticks = Array.from({ length: PRESSURE_MAX_CM / PRESSURE_STEP_CM + 1 }, (_, i) => i * PRESSURE_STEP_CM);
  const knobY = err ? 0 : yFor(p.cm as number);
  const alarm = !err && p.alarm ? p.alarm : null;

  return (
    <div className={`trc-press trc-click${err || alarm === 'emergency' ? ' trc-press--err' : ''}`} {...clickable(onClick)}>
      <span className="trc-press-title">Pressure</span>
      <div className={`trc-press-read${err || alarm === 'emergency' ? ' trc-press-read--err' : alarm ? ' trc-press-read--alarm' : ''}`}>
        <b>{err ? 'ERR' : (p.cm as number).toFixed(1)}</b>
        {!err && <i>CM</i>}
      </div>
      {alarm && (
        <span className={`trc-alarm trc-press-tag${alarm === 'emergency' ? ' trc-alarm--red' : ''}`}>
          {alarm === 'emergency' ? 'EMERG.' : alarm.toUpperCase()}
        </span>
      )}
      <div className="trc-tube" aria-label={err ? 'Pressure error' : `Drinker line pressure ${p.cm} cm`}>
        {ticks.map((cm) => (
          <div key={cm} className="trc-tube-tick" style={{ top: yFor(cm), width: cm % 10 === 0 ? 10 : 6 }} />
        ))}
        {!err && (
          <>
            <div className="trc-tube-fill" style={{ left: 3.65, top: knobY, height: 400 }} />
            <div className="trc-tube-knob" style={{ left: 3.41, top: knobY - 8.74 }} />
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Birds                                                               */
/* ------------------------------------------------------------------ */

const SILHOUETTE: Record<BirdGroup['label'], { src: string; style: CSSProperties }> = {
  Female: { src: 'assets/trio/hen-silhouette.png', style: { left: 35, top: 12, width: 225, height: 176 } },
  Male: { src: 'assets/trio/rooster-silhouette.png', style: { left: -2, top: 6, width: 264, height: 182 } },
};

function BirdCard({ g, onClick }: { g: BirdGroup; onClick: () => void }) {
  const err = g.avgKg === null;
  const s = SILHOUETTE[g.label];
  return (
    <div className={`trc-bird ${g.label === 'Female' ? 'trc-bird--f' : 'trc-bird--m'} trc-click`} {...clickable(onClick)}>
      <div className="trc-bird-top">
        <div className="trc-bird-sum">
          <b>{g.label}</b>
          <span>x</span>
          <span>{fmtInt(g.count)}</span>
        </div>
        <BigValue value={err ? null : (g.avgKg as number).toFixed(1)} unit="Kg" error={err} />
      </div>
      <div className="trc-bird-mort">
        {err && <span className="trc-bird-err">Weight unavailable</span>}
        <span>Mortality</span>
        <div className="trc-bird-row">
          <ChangeChip pct={g.mortalityPct} goodWhenUp={false} />
          <span className="trc-cmp">vs. Yesterday</span>
        </div>
      </div>
      <img src={s.src} alt="" style={s.style} />
    </div>
  );
}

function EditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 16h2.6L15 7.6a1.84 1.84 0 0 0-2.6-2.6L4 13.4V16Z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11.3 6.1l2.6 2.6" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Mortality modal + toast                                             */
/* ------------------------------------------------------------------ */

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="trc-step">
      <span className="trc-step-label">{label}</span>
      <div className="trc-step-ctrl">
        <button type="button" className="trc-step-btn" aria-label={`Decrease ${label}`} disabled={value <= 0} onClick={() => onChange(Math.max(0, value - 1))}>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <output aria-live="polite">{value}</output>
        <button type="button" className="trc-step-btn" aria-label={`Increase ${label}`} onClick={() => onChange(value + 1)}>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2 7h10M7 2v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function MortalityModal({ onCancel, onAdd }: { onCancel: () => void; onAdd: (dead: number, culled: number) => void }) {
  const [dead, setDead] = useState(0);
  const [culled, setCulled] = useState(0);
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return createPortal(
    <div className="trc-modal-root" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="trc-modal" role="dialog" aria-modal="true" aria-labelledby="trc-mort-title">
        <h2 id="trc-mort-title">Mortality update</h2>
        <p className="trc-modal-sub">Record today&apos;s dead and culled birds.</p>
        <div className="trc-step-list">
          <Stepper label="Dead" value={dead} onChange={setDead} />
          <Stepper label="Culled" value={culled} onChange={setCulled} />
        </div>
        <div className="trc-modal-foot">
          <button type="button" className="trc-btn trc-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="trc-btn" disabled={dead + culled === 0} onClick={() => onAdd(dead, culled)}>
            Add
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/* Column                                                              */
/* ------------------------------------------------------------------ */

export default function TrioRightColumn(props: { onOpen?: (w: Widget) => void }) {
  const open = (w: Widget) => () => props.onOpen?.(w);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [toast]);

  const silos = MOCK_SILOS.slice(0, 4);
  const water = MOCK_WATER;
  const feed = MOCK_FEED;
  const ratio = MOCK_WATER_FEED_RATIO ?? (water.total !== null && feed.total ? water.total / feed.total : null);

  return (
    <div className="trc-col">
      {/* Silo overview — 7792:2213 */}
      <section className="trc-section trc-silos trc-click" aria-label="Silo overview" {...clickable(open('silos'))}>
        {silos.map((s, i) => (
          <Silo key={s.name} silo={s} idx={i} />
        ))}
      </section>

      {/* Water and feed metrics — 7792:2362 */}
      <section className="trc-section trc-wf" aria-label="Water and feed metrics">
        <div className="trc-wf-main">
          <div className="trc-hdr">
            <span className="trc-h18">Water/Feed ratio</span>
            <span className="trc-ratio">{ratio === null ? '—' : ratio.toFixed(1)}</span>
          </div>
          <div className="trc-metrics">
            <MetricCard label="Water" metric={water} area={<AreaShape id="trc-area-water" d={WATER_AREA} />} onClick={open('water')} />
            <MetricCard label="Feed" metric={feed} area={<AreaShape id="trc-area-feed" d={FEED_AREA} />} onClick={open('feed')} />
          </div>
        </div>
        <Pressure p={MOCK_PRESSURE} onClick={open('pressure')} />
      </section>

      {/* Feed conversion metrics — 7792:2411 */}
      <section className="trc-section trc-fcr" aria-label="Feed conversion metrics">
        <div className="trc-fcr-head">
          <div className="trc-hdr">
            <span className="trc-h18">Feed conversion ratio</span>
            <span className="trc-ratio">{MOCK_FCR.toFixed(1)}</span>
          </div>
          <button type="button" className="trc-btn" onClick={() => setModal(true)}>
            <EditIcon />
            Mortality update
          </button>
        </div>
        <div className="trc-birds">
          {MOCK_BIRDS.map((g) => (
            <BirdCard key={g.label} g={g} onClick={open('birds')} />
          ))}
        </div>
      </section>

      {modal && (
        <MortalityModal
          onCancel={() => setModal(false)}
          onAdd={(dead, culled) => {
            setModal(false);
            setToast(`Mortality added · ${dead} dead · ${culled} culled`);
          }}
        />
      )}
      {toast &&
        createPortal(
          <div className="trc-toast" role="status">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <circle cx="9" cy="9" r="9" fill="var(--green-600, #41ac7d)" />
              <path d="M5 9.2l2.6 2.6L13 6.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {toast}
          </div>,
          document.body,
        )}
    </div>
  );
}
