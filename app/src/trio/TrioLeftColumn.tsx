import { useState, type KeyboardEvent, type ReactNode } from 'react';
import './TrioLeftColumn.css';

/* TrioAir — left column (Figma node 7792:2457, 608×791).
 * Temperature overview, humidity / air-quality gauges, light output and timers.
 * All values come from the mock constants below — edit them (or replace with live data). */

// ───────────────────────────── Mock data ─────────────────────────────

type HouseMode = 'minimum' | 'natural' | 'tunnel';

const TEMPERATURE = {
  /** Average measured temperature (°C). `null`/NaN = invalid sensor reading → "ERR". */
  measured: 27.6 as number | null,
  thi: 24.3,
  /** Wind chill is only shown in Tunnel mode. */
  houseMode: 'minimum' as HouseMode,
  windChill: 25.1,
  target: 25.5,
  /** Target indicator — priority Nighttime (moon) > THI > user offset; only the highest is shown. */
  nighttime: false,
  thiActive: false,
  userOffset: -0.5,
  /** Set points on the linear gauge. The gauge spans lowAlarm-2 … highAlarm+2. */
  setpoints: { heat: 22.4, tunnel: 26.9, cool: 28.8, lowAlarm: 21.7, highAlarm: 30.3 },
};

/** Per-sensor temperatures; a sensor further than SENSOR_WARN_DELTA from the average is flagged. */
const AREA_TEMPS: { id: string; label: string; value: number | null }[] = [
  { id: 'back', label: 'back', value: 24.3 },
  { id: 'center', label: 'center', value: 24.3 },
  { id: 'front', label: 'front', value: 24.3 },
];
const SENSOR_WARN_DELTA = 4;

/** 3-range gauges: normal min→setpoint, treatment setpoint→high, high→max. */
interface RangeGauge {
  value: number | null;
  unit: string;
  min: number;
  max: number;
  setpoint: number;
  high: number;
}

const HUMIDITY: RangeGauge & { treatmentActive: boolean } = {
  value: 25, unit: '%', min: 0, max: 100, setpoint: 48, high: 75, treatmentActive: false,
};
// PRD ranges: CO₂ 0–5000 ppm, NH₃ 0–100 ppm. Defaults keep the design's "%" labels;
// e.g. use { value: 1605, unit: 'ppm', min: 0, max: 5000, setpoint: 2750, high: 3000 } for real CO₂.
const CO2: RangeGauge = { value: 32.1, unit: '%', min: 0, max: 100, setpoint: 55, high: 56 };
const NH3: RangeGauge = { value: 14.3, unit: '%', min: 0, max: 100, setpoint: 55, high: 56 };

const LIGHT = {
  on: true,
  output: 56, // %
  lux: 320,
  sensorFailed: false,
  serviceMode: false, // initial state; the SERVICE LIGHT button toggles it
};

const TIMERS: { id: string; name: string; on: boolean }[] = [
  { id: 't1', name: 'Timer01', on: false },
  { id: 't2', name: 'Timer02', on: true },
  { id: 't3', name: 'Timer03', on: false },
  { id: 't4', name: 'Timer04', on: false },
];

// ───────────────────────────── Helpers ─────────────────────────────

type Widget = 'temperature' | 'humidity' | 'airQuality' | 'light' | 'timers';

const valid = (v: number | null | undefined): v is number => typeof v === 'number' && Number.isFinite(v);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const fmt1 = (v: number) => v.toFixed(1);

/** Point on a circle; angle in degrees, 0 = 12 o'clock, clockwise positive. */
function polar(cx: number, cy: number, r: number, a: number) {
  const rad = (a * Math.PI) / 180;
  return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)] as const;
}

/** Annular sector between radii r1<r2 from angle a0 to a1 (clockwise). */
function sector(cx: number, cy: number, r1: number, r2: number, a0: number, a1: number) {
  if (a1 <= a0) return '';
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x0, y0] = polar(cx, cy, r2, a0);
  const [x1, y1] = polar(cx, cy, r2, a1);
  const [x2, y2] = polar(cx, cy, r1, a1);
  const [x3, y3] = polar(cx, cy, r1, a0);
  return `M${x0} ${y0}A${r2} ${r2} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${r1} ${r1} 0 ${large} 0 ${x3} ${y3}Z`;
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  return `M${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

/** Fraction of a value along a gauge range (0…1), plus the 3 range boundaries. */
function rangeFractions(g: RangeGauge) {
  const f = (v: number) => clamp((v - g.min) / (g.max - g.min), 0, 1);
  const sp = f(g.setpoint);
  const hi = Math.max(sp, f(g.high));
  const val = valid(g.value) ? f(g.value) : null;
  const zone: 'normal' | 'treatment' | 'high' | 'error' =
    val === null ? 'error' : g.value! >= g.high ? 'high' : g.value! >= g.setpoint ? 'treatment' : 'normal';
  return { sp, hi, val, zone };
}

function clickable(widget: Widget, onOpen?: (w: Widget) => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick: () => onOpen?.(widget),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen?.(widget);
      }
    },
  };
}

// ───────────────────────────── Icons ─────────────────────────────

const MoonIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
    <path d="M8.9 7.9A4.4 4.4 0 0 1 4.1 3.1 4.4 4.4 0 1 0 8.9 7.9Z" fill="var(--gray-900)" />
  </svg>
);
const ThiIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
    <path d="M6 1.5 3.4 5.6a3 3 0 1 0 5.2 0Z" fill="var(--gray-900)" />
  </svg>
);
const OffsetIcon = ({ up }: { up: boolean }) => (
  <svg width="6" height="5" viewBox="0 0 6 5" aria-hidden style={up ? { transform: 'rotate(180deg)' } : undefined}>
    <path d="M3 5 0 0h6Z" fill="var(--gray-900)" />
  </svg>
);

const TimerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path d="M10 3.5a6.5 6.5 0 1 1-5.63 3.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10 10 6.6 6.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const BulbIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M12 3.5a7 7 0 0 0-4.2 12.6c.5.4.7.9.7 1.5v.9c0 .6.5 1 1 1h5c.5 0 1-.4 1-1v-.9c0-.6.2-1.1.7-1.5A7 7 0 0 0 12 3.5Z"
      stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
    />
    <circle cx="12" cy="10.5" r="2.6" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const WarnIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="tlc-warn-icon">
    <path d="M7 1.2 13 12H1Z" fill="var(--danger)" />
    <path d="M7 5v3.2" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="7" cy="10.1" r=".8" fill="#fff" />
  </svg>
);

const HumidityGlyph = ({ color }: { color: string }) => (
  <svg width="33" height="33" viewBox="0 0 33 33" fill="none" aria-hidden>
    <path d="M13 7.5c-3.6 4.6-5.6 8-5.6 10.7a5.6 5.6 0 0 0 11.2 0c0-2.7-2-6.1-5.6-10.7Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M20.5 9.5c1 .7 2 .7 3 0s2-.7 3 0M20.5 13c1 .7 2 .7 3 0s2-.7 3 0M20.5 16.5c1 .7 2 .7 3 0s2-.7 3 0" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// ───────────────────────────── Temperature ─────────────────────────────

const SCALE_TOP = 16; // px inside the summary card
const SCALE_H = 207;

function TemperatureCard({ onOpen }: { onOpen?: (w: Widget) => void }) {
  const t = TEMPERATURE;
  const sp = t.setpoints;
  const min = sp.lowAlarm - 2;
  const max = sp.highAlarm + 2;
  const y = (v: number) => SCALE_TOP + SCALE_H * clamp((max - v) / (max - min), 0, 1);

  const ok = valid(t.measured);
  const alarm = ok && (t.measured! > sp.highAlarm || t.measured! < sp.lowAlarm);

  const indicator: ReactNode = t.nighttime ? (
    <MoonIcon />
  ) : t.thiActive ? (
    <ThiIcon />
  ) : t.userOffset ? (
    <OffsetIcon up={t.userOffset > 0} />
  ) : null;
  const indicatorTitle = t.nighttime ? 'Nighttime' : t.thiActive ? 'THI' : t.userOffset ? `User offset ${t.userOffset > 0 ? '+' : ''}${t.userOffset}°` : '';

  const ticks: { key: string; label: string; v: number; short?: boolean }[] = [
    { key: 'cool', label: 'Cool', v: sp.cool },
    { key: 'tunnel', label: 'Tunnel', v: sp.tunnel },
    { key: 'target', label: 'Target', v: t.target, short: true },
    { key: 'heat', label: 'Heat', v: sp.heat },
  ];

  const avg = ok ? t.measured! : null;

  return (
    <section className="tlc-card tlc-temp tlc-click" aria-label="Temperature overview" {...clickable('temperature', onOpen)}>
      <div className="tlc-temp-summary">
        <div className="tlc-temp-label">Average temp.</div>
        <div className={`tlc-temp-value${!ok || alarm ? ' is-danger' : ''}`}>
          {ok ? (
            <>
              {fmt1(t.measured!)}
              <span className="tlc-temp-deg">°</span>
            </>
          ) : (
            'ERR'
          )}
        </div>
        <div className="tlc-temp-thi">
          <span className="tlc-temp-thi-v">{fmt1(t.thi)}</span>
          <span className="tlc-temp-thi-u">THI</span>
        </div>
        {t.houseMode === 'tunnel' && (
          <div className="tlc-temp-wc">
            Wind chill <b>{fmt1(t.windChill)}°</b>
          </div>
        )}

        <div className="tlc-target-chip">
          {indicator && (
            <span className="tlc-target-ind" title={indicatorTitle}>
              {indicator}
            </span>
          )}
          <span className="tlc-target-text">
            Target <b>{fmt1(t.target)}</b>
          </span>
        </div>

        {/* Linear gauge */}
        <div className="tlc-scale-bar" />
        {ticks.map((k) => (
          <div key={k.key} className="tlc-scale-tick" style={{ top: y(k.v) }}>
            <span className="tlc-scale-label">{k.label}</span>
            <span className={`tlc-scale-line${k.short ? ' is-short' : ''}`} />
          </div>
        ))}
        <span className="tlc-scale-target" style={{ top: y(t.target) - 4 }} />
        {ok && <span className="tlc-scale-marker" style={{ top: y(t.measured!) - 4.5 }} />}
      </div>

      <div className="tlc-house" aria-hidden>
        <img className="tlc-house-img" src="assets/trio/temp-tunnel.png" alt="" width={154} height={265} />
        {[66, 131.5, 197].map((top) => (
          <span key={top} className="tlc-house-divider" style={{ top }} />
        ))}
      </div>

      <div className="tlc-zones">
        <div className="tlc-h18">Area temp</div>
        {AREA_TEMPS.map((z) => {
          const zok = valid(z.value);
          const warn = !zok || (avg !== null && Math.abs(z.value! - avg) > SENSOR_WARN_DELTA);
          return (
            <div key={z.id} className={`tlc-zone${warn ? ' is-warn' : ''}`}>
              <div className="tlc-zone-reading">
                {zok ? (
                  <>
                    <span className="tlc-zone-v">{fmt1(z.value!)}°</span>
                    <span className="tlc-zone-u">C</span>
                  </>
                ) : (
                  <span className="tlc-zone-v">ERR</span>
                )}
                {warn && <WarnIcon />}
              </div>
              <div className="tlc-zone-label">{z.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ───────────────────────────── Humidity dial ─────────────────────────────

const HUM_C = { x: 86.2, y: 90.2 };
const humAngle = (f: number) => -120 + 240 * f;

function HumidityDial({ g, treatmentActive }: { g: RangeGauge; treatmentActive: boolean }) {
  const { sp, hi, val, zone } = rangeFractions(g);
  const { x: cx, y: cy } = HUM_C;
  const needle = val === null ? null : humAngle(val);
  const tickAngles = [-120, -90, -60, -30, 0, 30, 60, 90, 120];

  return (
    <svg className="tlc-hum-dial" width="172" height="177" viewBox="0 0 172 177" aria-hidden>
      <defs>
        <linearGradient id="tlcHumBezel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dedce2" />
          <stop offset="0.5" stopColor="#bdb8c2" />
          <stop offset="1" stopColor="#a39da8" />
        </linearGradient>
        <linearGradient id="tlcHumRim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9c6cd" />
          <stop offset="1" stopColor="#e9e8eb" />
        </linearGradient>
        <radialGradient id="tlcHumFace" cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#efeff0" />
          <stop offset="1" stopColor="#e6e6e8" />
        </radialGradient>
        <radialGradient id="tlcHumGreen" cx={cx} cy={cy} r="54" gradientUnits="userSpaceOnUse">
          <stop offset="0.6" stopColor="#9fdb8f" stopOpacity="0" />
          <stop offset="1" stopColor="#8ed27d" stopOpacity="0.95" />
        </radialGradient>
        <radialGradient id="tlcHumRed" cx={cx} cy={cy} r="54" gradientUnits="userSpaceOnUse">
          <stop offset="0.6" stopColor="#f6a8b0" stopOpacity="0" />
          <stop offset="1" stopColor="#f39aa5" stopOpacity="0.95" />
        </radialGradient>
        <radialGradient id="tlcHumGray" cx={cx} cy={cy} r="54" gradientUnits="userSpaceOnUse">
          <stop offset="0.6" stopColor="#d4d6d8" stopOpacity="0" />
          <stop offset="1" stopColor="#d4d6d8" stopOpacity="0.25" />
        </radialGradient>
        <filter id="tlcHumShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#6f6a75" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* bezel + face */}
      <circle cx={85.6} cy={90.6} r={85.4} fill="url(#tlcHumBezel)" filter="url(#tlcHumShadow)" />
      <path d={arc(85.6, 90.6, 86.5, -110, 10)} stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
      <circle cx={cx} cy={cy} r={76.5} fill="url(#tlcHumRim)" />
      <circle cx={cx} cy={cy} r={74.5} fill="url(#tlcHumFace)" />
      <clipPath id="tlcHumFaceClip">
        <circle cx={cx} cy={cy} r={74.5} />
      </clipPath>
      <circle cx={cx + 30} cy={cy - 34} r={66} fill="#fff" opacity="0.28" clipPath="url(#tlcHumFaceClip)" />

      {/* ranges */}
      <path d={sector(cx, cy, 32, 53.7, humAngle(0), humAngle(sp))} fill="url(#tlcHumGreen)" />
      <path d={sector(cx, cy, 32, 53.7, humAngle(sp), humAngle(hi))} fill="url(#tlcHumGray)" />
      <path d={sector(cx, cy, 32, 53.7, humAngle(hi), humAngle(0.985))} fill="url(#tlcHumRed)" />
      <path d={arc(cx, cy, 53.7, -125, 125)} stroke="#1b1d1d" strokeWidth="0.8" fill="none" />
      {tickAngles.map((a) => {
        const [x1, y1] = polar(cx, cy, 48.9, a);
        const [x2, y2] = polar(cx, cy, 53.7, a);
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1b1d1d" strokeWidth="0.85" />;
      })}

      <g transform={`translate(${cx - 24} ${cy + 26}) scale(1.45)`}>
        <HumidityGlyph color={treatmentActive ? 'var(--green-600)' : 'var(--gray-400)'} />
      </g>

      {/* needle */}
      {needle !== null && (
        <g transform={`rotate(${needle} ${cx} ${cy})`} className="tlc-needle">
          <path d={`M${cx - 0.7} ${cy - 57} L${cx + 0.7} ${cy - 57} L${cx + 1.8} ${cy} L${cx - 1.8} ${cy} Z`} fill="#0c0d0d" />
          <line x1={cx} y1={cy} x2={cx} y2={cy + 24} stroke="#0c0d0d" strokeWidth="4.4" strokeLinecap="round" />
        </g>
      )}
      <circle cx={cx} cy={cy} r={5.6} fill="#2b2d2e" />
      <circle cx={cx} cy={cy} r={3.8} fill="#8a8f92" />

      {zone === 'error' && (
        <text x={cx} y={cy - 18} textAnchor="middle" className="tlc-dial-err">
          ERR
        </text>
      )}
    </svg>
  );
}

// ───────────────────────────── Small arc gauge (CO₂ / NH₃) ─────────────────────────────

const SG = { cx: 62.86, cy: 162, half: 22 };
const sgAngle = (f: number) => -SG.half + 2 * SG.half * f;

function ArcGauge({ g }: { g: RangeGauge }) {
  const { sp, hi, val } = rangeFractions(g);
  const { cx, cy } = SG;
  const minor: number[] = [];
  for (let i = 0; i <= 40; i++) minor.push(sgAngle(i / 40));
  const major: number[] = [];
  for (let i = 0; i <= 8; i++) major.push(sgAngle(i / 8));
  const needle = val === null ? null : sgAngle(val);

  return (
    <svg className="tlc-arc-gauge" width="126" height="63" viewBox="0 0 126 63" aria-hidden>
      <defs>
        <linearGradient id="tlcArcBezel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6e8e9" />
          <stop offset="1" stopColor="#eceeee" />
        </linearGradient>
      </defs>
      <path
        d={sector(62.86, 149.1, 92, 145.9, -24.3, 24.3)}
        fill="url(#tlcArcBezel)"
        stroke="#e7e9ea"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path d={sector(cx, cy, 135.6, 143.6, sgAngle(0), sgAngle(sp))} fill="#b6e3a1" />
      <path d={sector(cx, cy, 135.6, 143.6, sgAngle(sp), sgAngle(hi))} fill="#d9dcdd" />
      <path d={sector(cx, cy, 135.6, 143.6, sgAngle(hi), sgAngle(1))} fill="#fcc4c4" />
      {minor.map((a) => {
        const [x1, y1] = polar(cx, cy, 129.5, a);
        const [x2, y2] = polar(cx, cy, 135.6, a);
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1b1d1d" strokeWidth="0.7" />;
      })}
      {major.slice(1, -1).map((a) => {
        const [x1, y1] = polar(cx, cy, 135.6, a);
        const [x2, y2] = polar(cx, cy, 141, a);
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1b1d1d" strokeWidth="0.9" />;
      })}
      <path d={arc(cx, cy, 135.6, sgAngle(0), sgAngle(1))} stroke="#1b1d1d" strokeWidth="0.9" fill="none" />
      {needle !== null && (
        <g transform={`rotate(${needle} ${cx} ${cy})`} className="tlc-needle">
          <path d={`M${cx - 0.5} ${cy - 146.5} L${cx + 0.5} ${cy - 146.5} L${cx + 2.3} ${cy - 108.5} L${cx - 2.3} ${cy - 108.5} Z`} fill="#0c0d0d" />
        </g>
      )}
    </svg>
  );
}

function AirMetric({ label, sub, g }: { label: string; sub: string; g: RangeGauge }) {
  const ok = valid(g.value);
  const { zone } = rangeFractions(g);
  return (
    <div className={`tlc-air-metric is-${zone}`}>
      <div className="tlc-air-reading">
        <div className="tlc-h18">
          {label}
          <sub>{sub}</sub>
        </div>
        <div className="tlc-air-value">
          {ok ? (
            <>
              <span className="tlc-air-v">{g.value!.toFixed(1)}</span>
              <span className="tlc-air-u">{g.unit}</span>
            </>
          ) : (
            <span className="tlc-air-v">ERR</span>
          )}
        </div>
      </div>
      <ArcGauge g={g} />
    </div>
  );
}

function EnvironmentCard({ onOpen }: { onOpen?: (w: Widget) => void }) {
  const ok = valid(HUMIDITY.value);
  const { zone } = rangeFractions(HUMIDITY);
  return (
    <section className="tlc-card tlc-env" aria-label="Environmental metrics">
      <div className={`tlc-hum tlc-click is-${zone}`} {...clickable('humidity', onOpen)}>
        <div className="tlc-hum-reading">
          <div className="tlc-h18">Humidity</div>
          <div className="tlc-big">
            {ok ? (
              <>
                {Math.round(HUMIDITY.value!)}
                <span className="tlc-big-u">%</span>
              </>
            ) : (
              'ERR'
            )}
          </div>
          {HUMIDITY.treatmentActive && <div className="tlc-hum-treat">Treatment on</div>}
        </div>
        <HumidityDial g={HUMIDITY} treatmentActive={HUMIDITY.treatmentActive} />
      </div>
      <div className="tlc-air tlc-click" {...clickable('airQuality', onOpen)}>
        <AirMetric label="CO" sub="2" g={CO2} />
        <AirMetric label="NH" sub="3" g={NH3} />
      </div>
    </section>
  );
}

// ───────────────────────────── Controls ─────────────────────────────

function LightCard({ onOpen }: { onOpen?: (w: Widget) => void }) {
  const [service, setService] = useState(LIGHT.serviceMode);
  const l = LIGHT;
  const on = l.on || service;
  const output = service ? 100 : l.on ? l.output : 0;
  const glow = on ? clamp(0.25 + output / 100, 0, 1.25) : 0;

  return (
    <section
      className={`tlc-light tlc-click${service ? ' is-service' : ''}${on ? '' : ' is-off'}`}
      aria-label="Light output"
      {...clickable('light', onOpen)}
    >
      <img className="tlc-light-glow" src="assets/trio/light-glow.png" alt="" style={{ opacity: Math.min(glow, 1) }} />
      <img className="tlc-light-glow tlc-light-glow2" src="assets/trio/light-glow.png" alt="" style={{ opacity: clamp(glow * 0.55, 0, 1) }} />
      <div className="tlc-light-shade" />

      <div className="tlc-light-reading">
        <div className="tlc-h18">Light output</div>
        <div className="tlc-big">
          {on ? (
            <>
              {Math.round(output)}
              <span className="tlc-big-u">%</span>
            </>
          ) : (
            'Off'
          )}
        </div>
      </div>
      <div className="tlc-light-status">
        <span className={`tlc-dot${on ? ' is-on' : ''}`} />
        <span>{on ? 'On' : 'Off'}</span>
        <span className="tlc-sep">·</span>
        {l.sensorFailed ? <span className="tlc-light-err">Sensor error</span> : <span>{l.lux} lux</span>}
        {service && <span className="tlc-service-badge">Service</span>}
      </div>

      <button
        type="button"
        className="tlc-light-btn"
        aria-pressed={service}
        onClick={(e) => {
          e.stopPropagation();
          setService((s) => !s);
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <BulbIcon />
        <span>{service ? 'Normal light' : 'Service light'}</span>
      </button>
    </section>
  );
}

function TimersCard({ onOpen }: { onOpen?: (w: Widget) => void }) {
  return (
    <section className="tlc-card tlc-timers tlc-click" aria-label="Timers" {...clickable('timers', onOpen)}>
      <div className="tlc-timers-list">
        <div className="tlc-timers-head tlc-h18">Timers</div>
        <div className="tlc-timer-items">
          {TIMERS.map((t) => (
            <div key={t.id} className={`tlc-timer${t.on ? ' is-on' : ''}`}>
              <TimerIcon />
              <span className="tlc-timer-name">{t.name}</span>
              <span className="tlc-timer-state">{t.on ? 'On' : 'Off'}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────────── Column ─────────────────────────────

export default function TrioLeftColumn(props: { onOpen?: (widget: 'temperature' | 'humidity' | 'airQuality' | 'light' | 'timers') => void }) {
  const { onOpen } = props;
  return (
    <div className="tlc-col">
      <TemperatureCard onOpen={onOpen} />
      <EnvironmentCard onOpen={onOpen} />
      <div className="tlc-controls">
        <LightCard onOpen={onOpen} />
        <TimersCard onOpen={onOpen} />
      </div>
    </div>
  );
}
