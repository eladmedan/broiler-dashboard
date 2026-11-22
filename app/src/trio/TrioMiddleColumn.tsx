import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import './TrioMiddleColumn.css';

/* ------------------------------------------------------------------ */
/* Mock data (defaults reproduce the Figma design, node 7828:2590)     */
/* ------------------------------------------------------------------ */

type VentMode = 'basic' | 'power' | 'tunnel';

const VENTILATION = {
  /** configured number of levels per mode (basic 10, power ≤20, tunnel ≤10) */
  levels: { basic: 10, power: 10, tunnel: 10 } as Record<VentMode, number>,
  /** current mode + level inside that mode → "P3" */
  mode: 'power' as VentMode,
  level: 3,
  /** min / max overall level (1-based, across all modes) */
  minLevel: 8,
  maxLevel: 20,
  cfm: 82100,
};

/** Cycle timer: visible only when cycling */
const CYCLE = { cycling: true, onSec: 10, offSec: 10 };

type FanGroup = { type: string; on: number; total: number };
const FANS: FanGroup[] = [
  { type: 'Side', on: 4, total: 6 },
  { type: 'Tunnel', on: 2, total: 4 },
  { type: 'Stir', on: 1, total: 2 },
  { type: 'Pit', on: 0, total: 2 },
];

const PRESSURE = {
  value: 25.1,
  target: 25.5,
  band: 2.5, // ± around target (blue band)
  lowAlarm: 20,
  highAlarm: 30,
  scaleMin: 15,
  scaleMax: 35,
  sensorOk: true,
  errorValue: 39,
};

const INLETS = {
  side: [0, 100, 100, 0],
  tunnel: [100, 0, 0, 100],
};

type Treatment = 'Cooling' | 'Heating' | 'RH' | 'CO2' | 'NH3';
const TREATMENTS: Treatment[] = ['Cooling', 'Heating', 'RH', 'CO2', 'NH3'];
/** design default: cooling + heating shown active */
const DEFAULT_ACTIVE_TREATMENTS: Treatment[] = ['Cooling', 'Heating'];

/* ------------------------------------------------------------------ */

type Widget = 'ventilation' | 'fans' | 'pressure' | 'inlets';

export interface TrioMiddleColumnProps {
  /** 'None' | 'Heating' | 'Cooling' | 'CO2' | 'NH3' | 'RH' → which treatment icon is active */
  ventDriver?: string;
  /** all inlets 0% */
  inletsClosed?: boolean;
  /** reading 39 Pa, red, out of band */
  pressureError?: boolean;
  onOpen?: (w: Widget) => void;
}

const MODE_PREFIX: Record<VentMode, string> = { basic: 'B', power: 'P', tunnel: 'T' };
const MODES: VentMode[] = ['basic', 'power', 'tunnel'];

function Clickable(props: {
  widget: Widget;
  className: string;
  label: string;
  onOpen?: (w: Widget) => void;
  children: ReactNode;
}) {
  const { widget, className, label, onOpen, children } = props;
  const open = () => onOpen?.(widget);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  };
  return (
    <div className={`tmc-click ${className}`} role="button" tabIndex={0} aria-label={label} onClick={open} onKeyDown={onKey}>
      {children}
    </div>
  );
}

/* ---------------------------- Ventilation --------------------------- */

function LevelScale() {
  const { levels, mode, level, minLevel, maxLevel } = VENTILATION;
  const total = levels.basic + levels.power + levels.tunnel;
  const offset = mode === 'basic' ? 0 : mode === 'power' ? levels.basic : levels.basic + levels.power;
  const current = offset + level; // 1-based overall level
  const bars = Array.from({ length: total }, (_, i) => {
    const n = i + 1;
    const h = Math.round(10 + (i * 59) / Math.max(1, total - 1));
    const state = n === current ? 'cur' : n >= minLevel && n <= maxLevel ? 'range' : 'out';
    return <div key={n} className={`tmc-bar tmc-bar--${state}`} style={{ height: h }} />;
  });
  return (
    <div className="tmc-scale">
      <div className="tmc-bars" aria-label={`Level ${current} of ${total}, min ${minLevel}, max ${maxLevel}`}>
        {bars}
      </div>
      <div className="tmc-groups">
        {MODES.filter((m) => levels[m] > 0).map((m, i) => (
          <div
            key={m}
            className={`tmc-group tmc-group--${m}${m === mode ? ' is-active' : ''}`}
            style={{ flex: `${levels[m]} 0 0`, borderTopWidth: i + 1 }}
          >
            {m[0].toUpperCase() + m.slice(1)}
          </div>
        ))}
      </div>
    </div>
  );
}

function TreatmentIcon({ t }: { t: Treatment }) {
  switch (t) {
    case 'Cooling':
      return (
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
          <path d="M9.6 4.2 12 6.4l2.4-2.2M9.6 19.8 12 17.6l2.4 2.2M4.5 10.4l3.1-.9-.7-3.1M19.5 13.6l-3.1.9.7 3.1M6.9 17.6l.7-3.1-3.1-.9M17.1 6.4l-.7 3.1 3.1.9" />
        </svg>
      );
    case 'Heating':
      return (
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M8 4.5c-1.3 1.4-1.3 2.6 0 4s1.3 2.6 0 4 -1.3 2.6 0 4M12 4.5c-1.3 1.4-1.3 2.6 0 4s1.3 2.6 0 4-1.3 2.6 0 4M16 4.5c-1.3 1.4-1.3 2.6 0 4s1.3 2.6 0 4-1.3 2.6 0 4" />
          <path d="M5 20h14" strokeWidth="1.8" />
        </svg>
      );
    case 'RH':
      return (
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6.5c-2.6 3.3-4 5.6-4 7.6a4 4 0 0 0 8 0c0-2-1.4-4.3-4-7.6Z" />
          <path d="M14.5 6.5c1-.7 1.8-.7 2.8 0s1.8.7 2.8 0M14.5 9.5c1-.7 1.8-.7 2.8 0s1.8.7 2.8 0M14.5 12.5c1-.7 1.8-.7 2.8 0s1.8.7 2.8 0" />
        </svg>
      );
    case 'CO2':
    case 'NH3':
      return (
        <svg viewBox="0 0 30 30" width="31" height="31">
          <path
            className="tmc-cloud"
            d="M8.4 9.6a4.6 4.6 0 0 1 6.8-3.3 4.6 4.6 0 0 1 7.6 2.9 4.4 4.4 0 0 1 2.4 7.2 4.5 4.5 0 0 1-3.6 6.9 4.6 4.6 0 0 1-7.4 1.4 4.6 4.6 0 0 1-7.8-1.6 4.4 4.4 0 0 1-2.2-7.3 4.4 4.4 0 0 1 4.2-6.2Z"
          />
          <text x="15" y="18.2" textAnchor="middle" className="tmc-cloud-txt">
            {t === 'CO2' ? 'CO' : 'NH'}
            <tspan fontSize="5.6" dy="1.6">
              {t === 'CO2' ? '2' : '3'}
            </tspan>
          </text>
        </svg>
      );
  }
}

/* ------------------------------- Fans ------------------------------- */

function FanIcon({ spinning, off }: { spinning: boolean; off: boolean }) {
  const blade = 'M45.5 38.6C44 31 47.4 24.6 54.3 22.6c3.4 6.7 2.2 13.9-3.7 17.6-1.8 1.1-4.1.6-5.1-1.6Z';
  return (
    <svg className="tmc-fan-ic" viewBox="0 0 86 86" width="86" height="86" aria-hidden>
      <circle cx="43" cy="43" r="43" className={off ? 'tmc-fan-disc is-off' : 'tmc-fan-disc'} />
      <g className={spinning ? 'tmc-fan-rotor is-spinning' : 'tmc-fan-rotor'}>
        {[0, 90, 180, 270].map((a) => (
          <path key={a} d={blade} transform={`rotate(${a} 43 43)`} className="tmc-fan-blade" />
        ))}
        <circle cx="43" cy="43" r="9.5" className="tmc-fan-blade" />
        <circle cx="43" cy="43" r="5" className={off ? 'tmc-fan-hub is-off' : 'tmc-fan-hub'} />
      </g>
    </svg>
  );
}

function useCycle() {
  const period = CYCLE.onSec + CYCLE.offSec;
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!CYCLE.cycling) return;
    const start = Date.now();
    const id = window.setInterval(() => setT(Math.floor((Date.now() - start) / 1000) % period), 1000);
    return () => window.clearInterval(id);
  }, [period]);
  if (!CYCLE.cycling) return { cycling: false, on: true, remaining: 0 };
  const on = t < CYCLE.onSec;
  return { cycling: true, on, remaining: on ? CYCLE.onSec - t : period - t };
}

/* ----------------------------- Pressure ----------------------------- */

const G = { cx: 100.5, cy: 100, rArc: 51, start: -120, end: 120 };

function angleOf(v: number) {
  const { scaleMin, scaleMax } = PRESSURE;
  const c = Math.min(scaleMax + 1, Math.max(scaleMin - 1, v));
  return G.start + ((c - scaleMin) / (scaleMax - scaleMin)) * (G.end - G.start);
}
function polar(a: number, r: number) {
  const rad = ((a - 90) * Math.PI) / 180;
  return [G.cx + r * Math.cos(rad), G.cy + r * Math.sin(rad)] as const;
}
function wedge(a0: number, a1: number, r: number) {
  const [x0, y0] = polar(a0, r);
  const [x1, y1] = polar(a1, r);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${G.cx} ${G.cy}L${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z`;
}
function arc(a0: number, a1: number, r: number) {
  const [x0, y0] = polar(a0, r);
  const [x1, y1] = polar(a1, r);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

function PressureGauge({ value, valid }: { value: number; valid: boolean }) {
  const { target, band, lowAlarm, highAlarm, scaleMin, scaleMax } = PRESSURE;
  const needle = valid ? angleOf(value) : G.start;
  const tgt = angleOf(target);
  const ticks = [-120, -90, -60, -30, 0, 30, 60, 90, 120];
  const [tx, ty] = polar(tgt, 61);
  return (
    <svg className="tmc-gauge" viewBox="0 0 201 199" width="201" height="199" aria-hidden>
      <defs>
        <linearGradient id="tmc-bezel" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#f1eff4" />
          <stop offset="0.55" stopColor="#c9c5cd" />
          <stop offset="1" stopColor="#a29da8" />
        </linearGradient>
        <linearGradient id="tmc-face" x1="0.2" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#f2f2f4" />
          <stop offset="1" stopColor="#e3e3e6" />
        </linearGradient>
        <radialGradient id="tmc-red" cx={G.cx} cy={G.cy} r="56" gradientUnits="userSpaceOnUse">
          <stop offset="0.15" stopColor="#ec4848" stopOpacity="0" />
          <stop offset="1" stopColor="#ec4848" stopOpacity="0.55" />
        </radialGradient>
        <radialGradient id="tmc-blue" cx={G.cx} cy={G.cy} r="56" gradientUnits="userSpaceOnUse">
          <stop offset="0.15" stopColor="#8ec4f1" stopOpacity="0" />
          <stop offset="1" stopColor="#8ec4f1" stopOpacity="0.9" />
        </radialGradient>
        <filter id="tmc-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <circle cx={G.cx} cy={G.cy + 1} r="88" fill="#ffffff" filter="url(#tmc-glow)" />
      <circle cx={G.cx} cy={G.cy + 1.5} r="83.4" fill="url(#tmc-bezel)" />
      <circle cx={G.cx} cy={G.cy + 1.5} r="83.4" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1" />
      <circle cx={G.cx + 0.4} cy={G.cy + 0.6} r="73" fill="url(#tmc-face)" />
      {/* zones */}
      <path d={wedge(angleOf(scaleMin), angleOf(lowAlarm), 51)} fill="url(#tmc-red)" />
      <path d={wedge(angleOf(highAlarm), angleOf(scaleMax), 51)} fill="url(#tmc-red)" />
      <path d={wedge(angleOf(target - band), angleOf(target + band), 51)} fill="url(#tmc-blue)" />
      {/* scale */}
      <path d={arc(G.start, G.end, G.rArc)} fill="none" stroke="#1b1d1d" strokeWidth="0.8" />
      {ticks.map((a) => {
        const [x0, y0] = polar(a, G.rArc);
        const [x1, y1] = polar(a, G.rArc + 4.7);
        return <line key={a} x1={x0} y1={y0} x2={x1} y2={y1} stroke="#1b1d1d" strokeWidth="0.8" />;
      })}
      {/* target marker */}
      <path
        d="M-3.6 -3 L3.6 -3 L0 3.2Z"
        fill="#1b1d1d"
        transform={`translate(${tx.toFixed(2)} ${ty.toFixed(2)}) rotate(${tgt})`}
      />
      {/* needle */}
      <g className="tmc-needle" style={{ transform: `rotate(${needle}deg)`, transformOrigin: `${G.cx}px ${G.cy}px` }}>
        <path
          d={`M${G.cx - 0.9} ${G.cy - 56} L${G.cx + 0.9} ${G.cy - 56} L${G.cx + 2.6} ${G.cy + 24} Q${G.cx} ${G.cy + 27} ${G.cx - 2.6} ${G.cy + 24}Z`}
          fill="#0c0d0d"
          style={{ filter: 'drop-shadow(2px 2px 1.5px rgba(0,0,0,.25))' }}
        />
        <circle cx={G.cx} cy={G.cy} r="6" fill="#8d9094" stroke="#1b1d1d" strokeWidth="1.4" />
      </g>
    </svg>
  );
}

/* ------------------------------ Inlets ------------------------------ */

function InletIcon({ pct }: { pct: number }) {
  const p = Math.max(0, Math.min(100, pct)) / 100;
  // inner frame 57×37 at (5,5); the flap slides down as the inlet opens
  const fillH = 37 * p * 0.62;
  const flapY = 5 + fillH;
  return (
    <svg viewBox="0 0 67 47" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <rect x="0" y="0" width="67" height="47" rx="11" fill="#e4e6e7" />
      <rect x="5.5" y="5.5" width="56" height="36" rx="5.5" fill="#e4e6e7" stroke="#4e5355" strokeWidth="1.5" />
      {p > 0 && (
        <>
          <clipPath id={`tmc-clip-${Math.round(pct)}`}>
            <rect x="5.5" y="5.5" width="56" height="36" rx="5.5" />
          </clipPath>
          <g clipPath={`url(#tmc-clip-${Math.round(pct)})`}>
            <rect x="5" y="5" width="57" height="37" fill="#4e5355" />
            <rect x="9" y={flapY + 3} width="49" height="14" rx="7" fill="#e4e6e7" />
          </g>
        </>
      )}
      <rect x="25.5" y={(p > 0 ? flapY + 7 : 8.5).toFixed(2)} width="16" height="3" rx="1.5" fill="#4e5355" />
    </svg>
  );
}

function InletGroup({ title, values }: { title: string; values: number[] }) {
  const open = values.filter((v) => v > 0).length;
  return (
    <div className="tmc-inlet-group">
      <div className="tmc-inlet-head">
        <span className="tmc-h18">{title}</span>
        <span className="tmc-count">
          {open}
          <span className="tmc-count-total">/{values.length}</span>
        </span>
      </div>
      <div className="tmc-inlet-grid" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>
        {values.map((v, i) => (
          <div key={i} className="tmc-inlet">
            <div className="tmc-inlet-ic">
              <InletIcon pct={v} />
            </div>
            <div className="tmc-inlet-pct">{Math.round(v)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- Main ------------------------------- */

export default function TrioMiddleColumn(props: TrioMiddleColumnProps) {
  const { ventDriver, inletsClosed = false, pressureError = false, onOpen } = props;

  const active: Treatment[] =
    ventDriver === undefined
      ? DEFAULT_ACTIVE_TREATMENTS
      : TREATMENTS.filter((t) => t.toLowerCase() === ventDriver.toLowerCase());

  const cycle = useCycle();

  const sensorOk = PRESSURE.sensorOk;
  const pValue = pressureError ? PRESSURE.errorValue : PRESSURE.value;
  const pAlarm = pValue < PRESSURE.lowAlarm || pValue > PRESSURE.highAlarm;

  const side = inletsClosed ? INLETS.side.map(() => 0) : INLETS.side;
  const tunnel = inletsClosed ? INLETS.tunnel.map(() => 0) : INLETS.tunnel;

  const fmtNum = (n: number) => n.toLocaleString('en-US');

  return (
    <div className="tmc-col">
      {/* Ventilation */}
      <Clickable widget="ventilation" className="tmc-vent" label="Ventilation" onOpen={onOpen}>
        <div className="tmc-vent-top">
          <div className="tmc-vent-left">
            <div className="tmc-vent-titles">
              <div className="tmc-h18 tmc-white">Ventilation</div>
              <div className="tmc-vent-level">
                {MODE_PREFIX[VENTILATION.mode]}
                {VENTILATION.level}
              </div>
            </div>
            <div className="tmc-vent-cfm">
              <span className="tmc-cfm-val">{fmtNum(VENTILATION.cfm)}</span>
              <span className="tmc-cfm-unit">CFM</span>
            </div>
          </div>
          <LevelScale />
        </div>
        <div className="tmc-treat">
          <span className="tmc-treat-label">Treatment</span>
          <div className="tmc-treat-icons">
            {TREATMENTS.map((t) => (
              <div key={t} className={`tmc-treat-ic${active.includes(t) ? ' is-active' : ''}`} title={t}>
                <TreatmentIcon t={t} />
              </div>
            ))}
          </div>
        </div>
      </Clickable>

      {/* Fans */}
      <Clickable widget="fans" className="tmc-fans" label="Fans" onOpen={onOpen}>
        <div className="tmc-fans-left">
          <span className="tmc-h18">Fans</span>
          <span className="tmc-fans-state">{cycle.on ? 'On' : 'Off'}</span>
          {cycle.cycling && (
            <span className="tmc-cycle">
              {cycle.on ? 'Off' : 'On'} in 0:{String(cycle.remaining).padStart(2, '0')}
            </span>
          )}
        </div>
        {FANS.map((f) => {
          const off = f.on === 0;
          return (
            <div key={f.type} className={`tmc-fan${off ? ' is-off' : ''}`}>
              <FanIcon off={off} spinning={!off && cycle.on} />
              <div className="tmc-fan-txt">
                <span className="tmc-fan-count">
                  {f.on}/{f.total}
                </span>
                <span className="tmc-fan-type">{f.type}</span>
              </div>
            </div>
          );
        })}
      </Clickable>

      {/* Pressure | Inlets */}
      <div className="tmc-bottom">
        <Clickable widget="pressure" className="tmc-pressure" label="Pressure" onOpen={onOpen}>
          <div className="tmc-pressure-head">
            <span className="tmc-h18">Pressure</span>
            <span className={`tmc-pressure-val${!sensorOk || pAlarm ? ' is-alarm' : ''}`}>
              {sensorOk ? (
                <>
                  {pValue.toFixed(1)}
                  <span className="tmc-pressure-unit">pa</span>
                </>
              ) : (
                'ERR'
              )}
            </span>
          </div>
          <div className="tmc-target">
            <span className="tmc-target-dot">
              <svg width="7" height="5" viewBox="0 0 7 5" aria-hidden>
                <path d="M0 0h7L3.5 5Z" fill="#fff" />
              </svg>
            </span>
            <span className="tmc-target-txt">
              Target <b>{PRESSURE.target}</b>
            </span>
          </div>
          <PressureGauge value={pValue} valid={sensorOk} />
        </Clickable>
        <div className="tmc-divider" />
        <Clickable widget="inlets" className="tmc-inlets" label="Inlets" onOpen={onOpen}>
          <InletGroup title="Side Inlets" values={side} />
          <InletGroup title="Tunnel Inlets" values={tunnel} />
        </Clickable>
      </div>
    </div>
  );
}
