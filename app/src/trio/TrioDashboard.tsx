import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './tokens.css';
import { TrioAppBar, TrioMainHeader, TrioStatusBar } from './TrioHeader';
import TrioLeftColumn from './TrioLeftColumn';
import TrioMiddleColumn from './TrioMiddleColumn';
import TrioRightColumn from './TrioRightColumn';
import type { DashboardConfig } from '../components/BroilerDashboard';

const W = 1920;
const H = 1080;

function useClock() {
  const fmt = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const [t, setT] = useState(fmt);
  useEffect(() => {
    const id = window.setInterval(() => setT(fmt()), 15000);
    return () => window.clearInterval(id);
  }, []);
  return t;
}

/** Scales the fixed 1920×1080 controller canvas to fit the space it is given. */
function useFitScale(ref: React.RefObject<HTMLDivElement>) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width && height) setScale(Math.min(width / W, height / H));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return scale;
}

/** TrioAir dashboard — implementation of Figma "🔵 Dashboard" node 7854:1962. */
export default function TrioDashboard(cfg: Partial<DashboardConfig>) {
  const box = useRef<HTMLDivElement>(null);
  const scale = useFitScale(box);
  const time = useClock();

  return (
    <div ref={box} style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div style={{ width: W * scale, height: H * scale, flex: 'none' }}>
        <div
          className="trio"
          style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: '0 0', background: 'var(--bg-01)', position: 'relative', overflow: 'hidden' }}
        >
          <TrioAppBar />
          <div style={{ padding: '15px 16px 0', marginTop: 10 }}>
            <TrioMainHeader house="01" day={2} time={time} />
            <div style={{ marginTop: 20 }}>
              <TrioStatusBar houseName="House 01" houseMode="House mode" />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 33, height: 791 }}>
              <div style={{ width: 608, flex: 'none' }}>
                <TrioLeftColumn />
              </div>
              <div style={{ width: 640, flex: 'none' }}>
                <TrioMiddleColumn ventDriver={cfg.ventDriver} inletsClosed={cfg.inletsClosed} pressureError={cfg.pressureError} />
              </div>
              <div style={{ width: 608, flex: 'none' }}>
                <TrioRightColumn />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
