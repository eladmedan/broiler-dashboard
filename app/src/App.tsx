import { useState } from 'react';
import BroilerDashboard, { type DashboardConfig } from './components/BroilerDashboard';

type Item =
  | { k: keyof DashboardConfig; label: string; type?: undefined; opts: string[]; def: string }
  | { k: keyof DashboardConfig; label: string; type: 'bool'; def: boolean };

const SPEC: { t: string; items: Item[] }[] = [
  {
    t: 'Screen',
    items: [
      { k: 'viewport', label: 'Screen', opts: ['SaaS desktop', 'Controller screen', 'SaaS tablet'], def: 'SaaS desktop' },
      { k: 'devices', label: 'Connected devices', opts: ['Minimum · 2', 'Typical · 7', 'Full · 10'], def: 'Full · 10' },
    ],
  },
  { t: 'Widgets', items: [{ k: 'houseView', label: 'House view', type: 'bool', def: false }] },
  {
    t: 'Air flow',
    items: [
      { k: 'ventDriver', label: 'Ventilation driver', opts: ['None', 'Heating', 'Cooling', 'CO2', 'NH3', 'RH'], def: 'Heating' },
      { k: 'inletsClosed', label: 'Inlets closed', type: 'bool', def: false },
      { k: 'pressureError', label: 'Pressure out of band', type: 'bool', def: false },
    ],
  },
];

const LS = 'broilerDashExportCfg3';
const LSO = 'broilerDashExportOpen';

const defaults = (): DashboardConfig => {
  const d: Record<string, unknown> = {};
  SPEC.forEach((g) => g.items.forEach((i) => (d[i.k] = i.def)));
  return d as unknown as DashboardConfig;
};

function load(): DashboardConfig {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(LS) || '{}');
  } catch {
    /* storage unavailable */
  }
  return { ...defaults(), ...saved };
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

const OptionsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
  </svg>
);

/** The exported page: the dashboard plus a client-facing Options panel docked on the right. */
export default function App() {
  const [cfg, setCfg] = useState<DashboardConfig>(load);
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LSO) !== '0';
    } catch {
      return true;
    }
  });

  const set = (k: keyof DashboardConfig, v: string | boolean) =>
    setCfg((c) => {
      const next = { ...c, [k]: v };
      save(LS, JSON.stringify(next));
      return next;
    });
  const toggle = () =>
    setOpen((o) => {
      save(LSO, o ? '0' : '1');
      return !o;
    });
  const reset = () => {
    const d = defaults();
    save(LS, JSON.stringify(d));
    setCfg(d);
  };

  return (
    <>
      <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <div style={{ flex: '1 1 0', minWidth: 0, height: '100%', position: 'relative', overflow: 'auto' }}>
          <BroilerDashboard {...cfg} />
        </div>
        {open && (
          <aside
            style={{
              flex: 'none', width: 280, height: '100%', boxSizing: 'border-box', borderLeft: '1px solid var(--color-divider)',
              background: 'var(--color-bg)', overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 600 }}>Options</span>
              <button className="btn btn-ghost btn-icon" onClick={toggle} aria-label="Hide options">→</button>
            </div>
            {SPEC.map((g) => (
              <div key={g.t} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-accent-700)', fontWeight: 600 }}>{g.t}</span>
                {g.items.map((i) => {
                  const on = !!cfg[i.k];
                  return (
                    <label key={i.k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--color-neutral-800)' }}>{i.label}</span>
                      {i.type === 'bool' ? (
                        <button
                          onClick={() => set(i.k, !cfg[i.k])}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 0, padding: '2px 0', cursor: 'pointer', font: 'inherit', color: 'var(--color-text)' }}
                        >
                          <span
                            style={{
                              position: 'relative', width: 36, height: 20, boxSizing: 'border-box',
                              border: '1px solid ' + (on ? 'var(--color-accent)' : 'var(--color-neutral-500)'),
                              background: on ? 'var(--color-accent)' : 'var(--color-bg)', flex: 'none',
                            }}
                          >
                            <span style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 14, height: 14, background: on ? '#fff' : 'var(--color-neutral-600)', transition: 'left .15s' }} />
                          </span>
                          {on ? 'On' : 'Off'}
                        </button>
                      ) : (
                        <select className="input" value={String(cfg[i.k])} onChange={(e) => set(i.k, e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
                          {i.opts.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      )}
                    </label>
                  );
                })}
              </div>
            ))}
            <button className="btn btn-secondary" onClick={reset} style={{ marginTop: 'auto' }}>Reset to defaults</button>
          </aside>
        )}
      </div>
      {!open && (
        <button className="btn btn-primary" onClick={toggle} style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 1000, gap: 8, boxShadow: 'var(--shadow-md)' }}>
          <OptionsIcon />
          Options
        </button>
      )}
    </>
  );
}
