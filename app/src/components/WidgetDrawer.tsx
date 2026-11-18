import React from 'react';
import type { CSSProperties } from 'react';
import { css } from '../dc';
import './WidgetDrawer.css';

export interface WidgetDrawerProps {
  wide?: boolean;
  w?: any;
  crumb?: string;
  onClose?: () => void;
  style?: CSSProperties;
}

/* Cached conversion of literal template style strings to React style objects. */
const styleCache = new Map<string, CSSProperties | undefined>();
const S = (str: string): CSSProperties | undefined => {
  let o = styleCache.get(str);
  if (o === undefined && !styleCache.has(str)) {
    o = css(str);
    styleCache.set(str, o);
  }
  return o;
};

/* `{{ x }}` text interpolation: undefined/null → '' */
const tx = (x: any) => (x == null ? '' : x);

function rand(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const Corners = () => (
  <>
    <i className="corner tl"></i>
    <i className="corner tr"></i>
    <i className="corner bl"></i>
    <i className="corner br"></i>
  </>
);

const FAN_PATH =
  'M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z';

class WidgetDrawer extends React.Component<WidgetDrawerProps, any> {
  static defaultProps = { crumb: 'Green Valley › House 3' };

  rootRef = React.createRef<HTMLDivElement>();
  _ro: ResizeObserver | null = null;

  componentDidMount() {
    const el = this.rootRef.current;
    if (!el || !window.ResizeObserver) return;
    this._ro = new ResizeObserver(() => {
      const c = el.clientHeight > 0 && el.clientHeight < 600;
      if (c !== this.state.compact) this.setState({ compact: c });
    });
    this._ro.observe(el);
  }
  componentWillUnmount() {
    this._ro && this._ro.disconnect();
  }
  state: any = { view: 'detail', tab: 'overview', mode: 'trend', range: '24h', ordered: false, g: null, st: null };
  componentDidUpdate(pp) {
    if ((pp.w && pp.w.id) !== (this.props.w && this.props.w.id))
      this.setState({ view: 'detail', tab: 'overview', mode: 'trend', range: '24h', g: null, st: null });
  }
  series(seed, n, c, flock, smooth): any {
    const r = rand(seed),
      mid = (c.tLo + c.tHi) / 2,
      amp = (c.tHi - c.tLo) * 0.55,
      y = (v) => Math.max(4, Math.min(196, 200 - ((v - c.lo) / (c.hi - c.lo)) * 200));
    const pts: any[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      let v;
      if (c.grow && flock) v = c.lo + (mid - c.lo) * (0.05 + 0.95 * t * t) + (smooth ? 0 : (r() - 0.5) * amp * 0.4);
      else v = mid + Math.sin(t * Math.PI * 2 * (n > 26 ? 3 : 1) + (seed % 5)) * amp * 0.7 + (smooth ? 0 : (r() - 0.5) * amp * 0.9);
      pts.push(`${(t * 600).toFixed(1)},${y(v).toFixed(1)}`);
    }
    return pts.join(' ');
  }
  siloVals(d, s): any {
    const sl = d.silos;
    if (!sl) return { hasSilos: false, noSilos: true, lowFeed: false, noLow: true };
    const o = d.order || { grower: 0, starter: 0 },
      g = s.g ?? o.grower,
      st = s.st ?? o.starter;
    const low = sl.filter((x) => x.days != null && x.days <= 7);
    const room = (t) =>
      sl
        .filter((x) => x.type === t && x.t != null)
        .reduce((a, x) => a + x.cap - x.t, 0)
        .toFixed(1);
    const into = (t) =>
      sl
        .filter((x) => x.type === t)
        .map((x) => x.n.replace('Silo ', 'S'))
        .join(' · ');
    return {
      hasSilos: true,
      noSilos: false,
      lowFeed: low.length > 0 && !s.ordered,
      noLow: !(low.length > 0 && !s.ordered),
      ordered: s.ordered,
      lowTitle: low.map((x) => x.n).join(' and ') + ' will run out within 1 week',
      orderSummary: `${g} t grower · ${st} t starter`,
      orderTotal: g + st,
      silos: sl.map((x) => {
        const err = x.pct < 0,
          lw = x.days != null && x.days <= 7,
          red = lw || err;
        return {
          ...x,
          hasErr: !!x.err,
          tons: err ? '—' : x.t.toFixed(1),
          capText: err ? 'no reading' : `t of ${x.cap} t · ${x.pct}%`,
          daysText: err ? 'Days left unknown' : x.days + ' days left',
          daysStyle: { fontSize: 13, fontWeight: 600, color: red ? '#b3261e' : 'var(--color-accent-800)' },
          card: {
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: 14,
            border: '1px solid ' + (red ? '#e0a39c' : 'var(--color-divider)'),
            background: red ? '#fffafa' : 'var(--color-bg)',
          },
          body: {
            position: 'relative',
            width: 44,
            height: 78,
            boxSizing: 'border-box',
            border: '1.5px solid var(--color-text)',
            borderTop: 'none',
            borderBottom: 'none',
          },
          fill: err
            ? { position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg,transparent 0 4px,#e8a39b 4px 5px)' }
            : { position: 'absolute', left: 0, right: 0, bottom: 0, height: x.pct + '%', background: lw ? '#b3261e' : 'var(--color-accent-300)' },
        };
      }),
      orderLines: ([
        ['Grower', g, 'g'],
        ['Starter', st, 'st'],
      ] as any[]).map(([type, t, k]) => ({
        type,
        t,
        into: into(type),
        room: room(type),
        dec: () => this.setState({ [k]: Math.max(0, t - 1) }),
        inc: () => this.setState({ [k]: t + 1 }),
      })),
      toOrder: () => this.setState({ view: 'order' }),
      placeOrder: () => this.setState({ view: 'detail', ordered: true }),
    };
  }
  pgVals(p, s): any {
    if (!p) return { hasPG: false };
    const MIN = p.min ?? 0,
      MAX = p.max ?? 40,
      cx = 200,
      cy = 205,
      r = 160,
      sim = s.pSim || 'normal';
    const v = sim === 'alarm' ? p.high + 6 : p.v,
      ok = sim !== 'error',
      out = ok && (v < p.low || v > p.high),
      outBand = ok && !out && Math.abs(v - p.target) > p.band;
    const fr = (x) => Math.max(0, Math.min(1, (x - MIN) / (MAX - MIN)));
    const pt = (x, rr) => {
      const a = Math.PI * (1 - fr(x));
      return [cx + rr * Math.cos(a), cy - rr * Math.sin(a)];
    };
    const arc = (a, b) => {
      if (b <= a) return '';
      const [x1, y1] = pt(a, r),
        [x2, y2] = pt(b, r);
      return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    };
    const tick = (x, r1, r2) => {
      const [x1, y1] = pt(x, r1),
        [x2, y2] = pt(x, r2);
      return { x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1) };
    };
    const red = '#b3261e',
      col = !ok || out || outBand ? red : 'var(--color-text)';
    const lab = (x, rr, t, st) => {
      const [lx, ly] = pt(x, rr);
      return {
        t,
        s: {
          position: 'absolute',
          left: ((lx / 400) * 100).toFixed(2) + '%',
          top: ((ly / 250) * 100).toFixed(2) + '%',
          transform: 'translate(-50%,-50%)',
          whiteSpace: 'nowrap',
          fontSize: 12,
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--color-neutral-700)',
          pointerEvents: 'none',
          ...st,
        },
      };
    };
    const majors: any[] = [];
    for (let x = MIN; x <= MAX; x += 5) majors.push(x);
    const bl = p.target - p.band,
      bh = p.target + p.band,
      t1 = pt(p.target, r - 22),
      t2 = pt(p.target, r + 22),
      nb = pt(v, r * 0.5),
      nn = pt(v, r * 0.86);
    const pg = {
      track: arc(MIN, MAX),
      lowZ: arc(MIN, p.low),
      highZ: arc(p.high, MAX),
      okZ: arc(bl, bh),
      minor: Array.from({ length: MAX - MIN + 1 }, (_, i) => MIN + i)
        .filter((x) => x % 5)
        .map((x) => tick(x, r + 18, r + 23)),
      major: majors.map((x) => tick(x, r + 18, r + 28)),
      limits: [p.low, p.high].map((x) => tick(x, r - 17, r + 17)),
      tx1: t1[0].toFixed(1),
      ty1: t1[1].toFixed(1),
      tx2: t2[0].toFixed(1),
      ty2: t2[1].toFixed(1),
      nbx: nb[0].toFixed(1),
      nby: nb[1].toFixed(1),
      nx: nn[0].toFixed(1),
      ny: nn[1].toFixed(1),
      labels: [
        ...majors.filter((x) => x !== p.target).map((x) => lab(x, r + 40, String(x), {})),
        lab(p.target, r + 48, 'Target ' + p.target, { color: 'var(--color-accent-900)', fontWeight: 700, transform: 'translate(-50%,-70%)' }),
        lab(p.target, r + 48, '±' + p.band + ' Pa band', { color: 'var(--color-accent-800)', fontSize: 11, transform: 'translate(-50%,-190%)' }),
        lab(p.low, r - 36, 'Low ' + p.low, { color: red, fontWeight: 600, fontSize: 11 }),
        lab(p.high, r - 36, 'High ' + p.high, { color: red, fontWeight: 600, fontSize: 11 }),
      ],
    };
    const big = { fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 600, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' };
    const sel = { background: 'var(--color-accent)', color: '#fff' };
    return {
      hasPG: true,
      pg: {
        ...pg,
        vS: { fontFamily: 'var(--font-heading)', fontSize: 56, fontWeight: 700, lineHeight: 0.95, fontVariantNumeric: 'tabular-nums', color: col },
        subS: { fontSize: 13, fontWeight: 600, color: col === red ? red : 'var(--color-neutral-700)' },
        ok,
        needle: col,
        vTxt: ok ? String(v) : 'ERR',
        sub: !ok ? 'Sensor failure' : out ? 'Outside alarm limits' : outBand ? 'Outside target band' : 'In band',
        vals: [
          { k: 'Measured pressure', v: ok ? v : 'Error', u: ok ? 'Pa' : '', vS: { ...big, color: col } },
          { k: 'Pressure setpoint', v: p.target, u: '± ' + p.band + ' Pa', vS: big },
          { k: 'High pressure alarm', v: p.high, u: 'Pa', vS: big },
          { k: 'Low pressure alarm', v: p.low, u: 'Pa', vS: big },
        ],
        sims: [
          ['normal', 'Normal'],
          ['alarm', 'Out of limits'],
          ['error', 'Sensor error'],
        ].map(([k, l]) => ({ label: l, pick: () => this.setState({ pSim: k }), style: sim === k ? sel : {} })),
      },
    };
  }
  bmVals(b): any {
    if (!b) return { hasBM: false };
    const fmt = (n) => n.toLocaleString('en-US');
    const comb = (t) =>
      t === 'rooster'
        ? 'M40 30c-2-8 4-12 8-8 0-8 8-10 10-3 4-6 12-3 9 5-2 4-6 6-10 6H44c-3 0-4-0-4 0z'
        : 'M44 30c0-5 4-7 7-4 2-4 7-4 8 1 3-1 5 2 3 5-1 1-3 2-5 2H46c-2 0-2-2-2-4z';
    const sexes = b.sexes.map((x) => {
      const good = x.score >= 80,
        ok = x.score >= 65,
        dv = (x.w / x.curve - 1) * 100;
      const hc = good ? '#d6ecff' : ok ? '#fdf0d6' : '#fdecea',
        mc = good ? 'var(--color-accent-800)' : ok ? '#a8641c' : '#b3261e';
      return {
        ...x,
        countT: fmt(x.count),
        mood: good ? 'Thriving' : ok ? 'Doing okay' : 'Needs attention',
        halo: hc,
        body: x.type === 'rooster' ? '#fff7ec' : '#fbe9d0',
        wing: x.type === 'rooster' ? '#f0dcc0' : '#ecd2ae',
        tail: '#3e5d8a',
        tail2: '#6a8fc0',
        showTail: { display: x.type === 'rooster' ? 'inline' : 'none' },
        comb: comb(x.type),
        eye: good ? 'M44 42q4-5 8 0' : ok ? 'M44 42h8' : 'M44 44q4-4 8 0',
        card: {
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 16,
          border: '1px solid var(--color-divider)',
          background: `linear-gradient(135deg,${hc}99,transparent 60%)`,
        },
        scoreS: { fontFamily: 'var(--font-heading)', fontSize: 44, fontWeight: 600, lineHeight: 1, color: mc },
        moodS: { fontSize: 14, fontWeight: 600, color: mc, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
        kpis: [
          {
            k: 'Avg weight',
            v: x.w.toFixed(2) + ' kg',
            s: (dv >= 0 ? '+' : '') + dv.toFixed(1) + '% vs curve',
            sS: { fontSize: 10, color: dv < -2 ? '#b3261e' : 'var(--color-neutral-700)' },
          },
          { k: 'Daily gain', v: x.gain + ' g', s: 'last 7 days', sS: { fontSize: 10, color: 'var(--color-neutral-700)' } },
          { k: 'Uniformity', v: x.unif + '%', s: 'CV ' + x.cv + '%', sS: { fontSize: 10, color: x.unif < 80 ? '#a8641c' : 'var(--color-neutral-700)' } },
          { k: 'Mortality', v: x.mort + '%', s: 'cumulative', sS: { fontSize: 10, color: 'var(--color-neutral-700)' } },
        ],
      };
    });
    const G = b.growth,
      gm = Math.max(...G.male),
      pts = (a) => a.map((v, i) => `${((G.days[i] / b.market) * 400).toFixed(1)},${(136 - (v / (gm * 1.1)) * 130).toFixed(1)}`).join(' ');
    const H = b.hist,
      hm = Math.max(...H.male, ...H.female);
    const mm = Math.max(...b.mort),
      cum = b.placed - b.now;
    return {
      hasBM: true,
      bm: {
        sexes,
        stats: [
          { k: 'Birds in house', v: fmt(b.now), u: '', s: 'of ' + fmt(b.placed) + ' placed' },
          { k: 'Mortality', v: ((cum / b.placed) * 100).toFixed(1), u: '%', s: fmt(cum) + ' birds · ' + b.mortToday + ' today' },
          { k: 'Flock age', v: b.day, u: 'days', s: b.market - b.day + ' days to market' },
          { k: 'FCR', v: b.fcr.toFixed(2), u: '', s: 'feed / gain' },
        ],
        gMale: pts(G.male),
        gFemale: pts(G.female),
        gCurve: pts(G.curve),
        gDays: ['Day 0', '7', '14', '21', '28', '35', '42'],
        hist: H.bins.map((k, i) => ({
          k,
          m: { flex: 1, height: (H.male[i] / hm) * 100 + '%', background: 'var(--color-accent-700)' },
          f: { flex: 1, height: (H.female[i] / hm) * 100 + '%', background: '#c2557a' },
        })),
        mort: b.mort.map((v) => ({
          v,
          style: {
            position: 'relative',
            flex: 1,
            height: (v / mm) * 100 + '%',
            background: v === b.mortToday && false ? '#b3261e' : 'var(--color-neutral-400)',
          },
        })),
        mortNote: 'Trending down · ' + b.mortToday + ' today',
      },
    };
  }
  lmVals(m): any {
    if (!m) return { hasLM: false };
    const all = m.rows.filter((r) => r.on).flatMap((r) => r.lux),
      avgAll = all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0;
    const rows = m.rows.map((r) => {
      const on = !!r.on,
        av = on ? r.lux.reduce((a, b) => a + b, 0) / r.lux.length : 0,
        mn = on ? Math.min(...r.lux) : 0,
        low = on && mn < 15;
      return {
        k: r.k,
        state: on ? 'On' : 'Off',
        colorText: r.color + (r.kelvin ? ' · ' + r.kelvin + ' K' : ''),
        pctText: on ? r.pct + ' %' : '—',
        avg: on ? av.toFixed(0) : '—',
        min: on ? mn : '—',
        strip: {
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: `repeat(${r.lux.length},minmax(0,1fr))`,
          gap: 2,
          boxShadow: on ? `0 0 ${Math.round(r.pct / 4)}px ${r.hex}` : 'none',
          outline: '1px solid ' + (on ? r.hex : '#444'),
          outlineOffset: 1,
        },
        lamp: {
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          height: 2,
          transform: 'translateY(-50%)',
          background: on ? r.hex : '#555',
          opacity: on ? 0.9 : 0.6,
          zIndex: 1,
        },
        pill: {
          position: 'relative',
          width: 40,
          height: 64,
          borderRadius: 14,
          background: '#3a3a3c',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          flex: 'none',
          boxShadow: on ? `0 0 18px ${r.hex}55` : 'none',
        },
        pillFill: {
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: (on ? r.pct : 0) + '%',
          background: on ? `linear-gradient(#fffaf0,${r.hex})` : 'transparent',
          transition: 'height .4s ease',
        },
        pillPct: on ? r.pct + '%' : 'Off',
        iconC: on && r.pct > 20 ? '#1d1f20' : '#8e8e93',
        one: ((v) => {
          const a = on ? Math.max(0.08, Math.min(1, v / 26)) : 0,
            low = on && v < 15;
          return {
            v: on ? 'avg ' + v + ' lux' : 'Off',
            pool: {
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: 12,
              background: on
                ? `radial-gradient(ellipse 85% 100% at 50% 0%, ${r.hex}${Math.round(a * 230)
                    .toString(16)
                    .padStart(2, '0')} 0%, ${r.hex}${Math.round(a * 90)
                    .toString(16)
                    .padStart(2, '0')} 45%, transparent 78%)`
                : 'transparent',
              boxShadow: low ? 'inset 0 -2px 0 #e0473a' : 'none',
            },
            fix: {
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '55%',
              height: 6,
              borderRadius: '0 0 3px 3px',
              zIndex: 3,
              background: on ? '#fffaf0' : '#3a3a3c',
              boxShadow: on ? `0 2px 10px 2px ${r.hex}, 0 0 22px 6px ${r.hex}aa` : 'none',
            },
            tS: { fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: low ? '#ff8a80' : '#f2f2f7', position: 'relative', zIndex: 3 },
          };
        })(Math.round(av)),
        row: {
          display: 'grid',
          gridTemplateColumns: '50px 70px minmax(0,1fr) 110px 90px 90px',
          gap: 12,
          alignItems: 'center',
          fontSize: 13,
          padding: '8px 0',
          borderBottom: '1px solid var(--color-divider)',
          color: on ? 'var(--color-text)' : 'var(--color-neutral-600)',
        },
        chip: {
          justifySelf: 'start',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '.06em',
          padding: '1px 8px',
          background: on ? 'var(--color-accent)' : 'var(--color-neutral-200)',
          color: on ? '#fff' : 'var(--color-neutral-600)',
        },
        sw: { width: 14, height: 14, borderRadius: '50%', background: r.hex, border: '1px solid var(--color-neutral-400)', opacity: on ? 1 : 0.45, flex: 'none' },
        minS: { textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: low ? '#b3261e' : 'inherit', fontWeight: low ? 700 : 400 },
      };
    });
    const onN = m.rows.filter((r) => r.on).length;
    return {
      hasLM: true,
      lm: {
        target: m.target,
        rows,
        stats: [
          { k: 'House average', v: avgAll.toFixed(0), u: 'lux', s: 'lit rows' },
          { k: 'Rows on', v: onN + ' / ' + m.rows.length, u: '', s: 'light lines' },
          { k: 'Schedule', v: m.on + '–' + m.off, u: '', s: 'dimming ' + m.dim },
          { k: 'Target', v: m.target, u: 'lux', s: 'day 28 program' },
        ],
      },
    };
  }
  wfVals(x): any {
    if (!x) return { hasWF: false };
    const fmt = (n) => n.toLocaleString('en-US'),
      pc = (v, a, b) => Math.max(0, Math.min(100, ((v - a) / (b - a)) * 100));
    const dW = (x.water.today / x.water.yday - 1) * 100,
      dF = (x.feed.today / x.feed.yday - 1) * 100,
      rOk = x.ratio >= x.rBand[0] && x.ratio <= x.rBand[1];
    const sd = (v) => ({ fontSize: 12, color: Math.abs(v) >= 10 ? '#b3261e' : 'var(--color-neutral-700)' });
    const mx = Math.max(...x.hw);
    const dark = (h) => (x.dark[0] > x.dark[1] ? h >= x.dark[0] || h < x.dark[1] : h >= x.dark[0] && h < x.dark[1]);
    const P = x.water;
    return {
      hasWF: true,
      wf: {
        ratio: x.ratio.toFixed(2),
        rMin: x.rMin,
        rMax: x.rMax,
        rBandT: x.rBand.join('–'),
        p: P.pressure,
        emergency: P.emergency,
        pan: x.feed.pan,
        program: x.feed.program,
        wAl: P.loAlarm + ' / ' + P.hiAlarm,
        fAl: x.feed.loAlarm + ' / ' + x.feed.hiAlarm,
        stats: [
          { k: 'Water today', v: fmt(x.water.today), u: 'L', s: (dW >= 0 ? '+' : '') + dW.toFixed(1) + '% vs yesterday', sS: sd(dW) },
          { k: 'Feed today', v: fmt(x.feed.today), u: 'kg', s: (dF >= 0 ? '+' : '') + dF.toFixed(1) + '% vs yesterday', sS: sd(dF) },
          { k: 'Per bird', v: Math.round((x.water.today / x.birds) * 1000), u: 'ml', s: Math.round((x.feed.today / x.birds) * 1000) + ' g feed', sS: sd(0) },
          {
            k: 'W / F ratio',
            v: x.ratio.toFixed(2),
            u: '',
            s: rOk ? 'Within target' : 'Outside target',
            sS: { fontSize: 12, color: rOk ? 'var(--color-accent-800)' : '#b3261e', fontWeight: 600 },
          },
        ],
        rBand: {
          position: 'absolute',
          top: 12,
          height: 10,
          left: pc(x.rBand[0], x.rMin, x.rMax) + '%',
          width: pc(x.rBand[1], x.rMin, x.rMax) - pc(x.rBand[0], x.rMin, x.rMax) + '%',
          background: 'var(--color-accent-300)',
        },
        rMark: {
          position: 'absolute',
          top: 6,
          height: 22,
          width: 3,
          left: `calc(${pc(x.ratio, x.rMin, x.rMax)}% - 1.5px)`,
          background: rOk ? 'var(--color-text)' : '#b3261e',
        },
        rLab: {
          position: 'absolute',
          top: -6,
          left: pc(x.ratio, x.rMin, x.rMax) + '%',
          transform: 'translateX(-50%)',
          fontSize: 11,
          fontWeight: 700,
          lineHeight: '12px',
        },
        hours: x.hw.map((w, i) => ({
          col: {
            flex: 1,
            height: '100%',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
            background: dark(i) ? 'var(--color-neutral-100)' : 'transparent',
          },
          w: { flex: 1, height: (w / mx) * 100 + '%', background: 'var(--color-accent-300)' },
          f: { flex: 1, height: (x.hf[i] / mx) * 100 * 1.6 + '%', background: 'var(--color-accent-900)' },
        })),
        meters: P.meters.map(([k, v]) => ({ k, v: fmt(v) })),
        pBand: {
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: pc(P.pBand[0], 0, P.pMax) + '%',
          width: pc(P.pBand[1], 0, P.pMax) - pc(P.pBand[0], 0, P.pMax) + '%',
          background: 'var(--color-accent-300)',
        },
        pMark: {
          position: 'absolute',
          top: -4,
          bottom: -4,
          width: 3,
          left: `calc(${pc(P.pressure, 0, P.pMax)}% - 1.5px)`,
          background: 'var(--color-text)',
        },
        lines: x.feed.lines.map(([k, v, on]) => ({
          k,
          v: fmt(v),
          st: on ? 'Running' : 'Idle',
          chip: {
            fontSize: 10,
            fontWeight: 700,
            padding: '1px 6px',
            background: on ? 'var(--color-accent)' : 'var(--color-neutral-200)',
            color: on ? '#fff' : 'var(--color-neutral-600)',
          },
        })),
      },
    };
  }
  tmapVals(t): any {
    if (!t) return { hasTMap: false };
    const col = (d) => (d >= 1.5 ? '#e0473a' : d >= 0.8 ? '#f2a38f' : d <= -1.5 ? '#5aa9e6' : '#a9dcff');
    const grads = t.sensors.map((s) => `radial-gradient(circle at ${s.x}% ${s.y}%, ${col(s.v - t.target)} 0, transparent 34%)`);
    const vals = t.sensors.map((s) => s.v),
      spread = (Math.max(...vals) - Math.min(...vals)).toFixed(1);
    const sensors = t.sensors.map((s) => {
      const dv = s.v - t.avg,
        d = (dv >= 0 ? '+' : '') + dv.toFixed(1) + '°',
        al = !!s.al;
      return {
        ...s,
        d,
        st: al ? 'Alarm' : 'OK',
        pos: { position: 'absolute', left: s.x + '%', top: s.y + '%', transform: 'translate(-50%,-50%)', zIndex: 3 },
        ring: {
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 14,
          height: 14,
          transform: 'translate(-50%,-50%)',
          borderRadius: '50%',
          border: '2px solid ' + (al ? '#b3261e' : 'var(--color-text)'),
          background: 'var(--color-bg)',
        },
        card: {
          position: 'relative',
          left: 12,
          top: -30,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '4px 8px',
          background: 'rgba(255,255,255,.92)',
          border: '1px solid ' + (al ? '#b3261e' : 'var(--color-neutral-400)'),
          whiteSpace: 'nowrap',
          lineHeight: 1.1,
        },
        vS: { fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 600, color: al ? '#b3261e' : 'var(--color-text)', fontVariantNumeric: 'tabular-nums' },
        dS: { fontSize: 10, color: al ? '#b3261e' : 'var(--color-neutral-700)' },
        dS2: { textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: al ? '#b3261e' : 'var(--color-neutral-700)', fontWeight: al ? 600 : 400 },
        row: {
          display: 'grid',
          gridTemplateColumns: '50px minmax(0,1fr) 80px 80px 70px',
          gap: 12,
          alignItems: 'center',
          fontSize: 13,
          padding: '8px 0',
          borderBottom: '1px solid var(--color-divider)',
          background: al ? '#fdecea' : 'transparent',
        },
        chip: {
          justifySelf: 'start',
          fontSize: 11,
          fontWeight: 600,
          padding: '1px 8px',
          background: al ? '#b3261e' : 'var(--color-neutral-100)',
          color: al ? '#fff' : 'var(--color-neutral-800)',
        },
      };
    });
    const heaters = t.heaters.map((x) => ({
      k: x.k,
      st: x.on ? 'Firing' : 'Off',
      pos: {
        position: 'absolute',
        left: x.x + '%',
        top: x.y + '%',
        transform: 'translate(-50%,-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        zIndex: 2,
      },
      dot: {
        width: 26,
        height: 26,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        fontSize: 9,
        fontWeight: 700,
        color: '#fff',
        background: x.on ? '#e07a2f' : 'var(--color-neutral-500)',
        boxShadow: x.on ? '0 0 0 6px rgba(224,122,47,.2)' : 'none',
      },
      lab: { fontSize: 9, color: 'var(--color-neutral-700)' },
    }));
    const inlets: any[] = [];
    [10, 26, 42, 58, 74].forEach((l) => {
      inlets.push({ style: { position: 'absolute', top: 0, left: l + '%', width: '6%', height: 3, background: 'var(--color-neutral-700)' } });
      inlets.push({ style: { position: 'absolute', bottom: 0, left: l + '%', width: '6%', height: 3, background: 'var(--color-neutral-700)' } });
    });
    return {
      hasTMap: true,
      tm: {
        sensors,
        heaters,
        inlets,
        stats: [
          { k: 'House avg', v: t.avg.toFixed(1), u: '°C', s: '4 sensors' },
          { k: 'Target', v: t.target.toFixed(1), u: '°C', s: 'day 28 curve' },
          { k: 'Spread', v: spread, u: '°', s: 'warmest − coolest' },
          { k: 'Outside', v: t.outside.toFixed(1), u: '°C', s: 'weather station' },
        ],
        house: {
          position: 'relative',
          flex: 1,
          height: 260,
          border: '2px solid var(--color-text)',
          background: grads.join(',') + ',linear-gradient(#e3f2ff,#e3f2ff)',
        },
      },
    };
  }
  progVals(s): any {
    const pt = s.progTab || 'basic',
      cur = pt === 'basic' ? 3 : -1;
    const P = {
      basic: {
        n: 6,
        pre: 'L',
        fans: [0, 1, 2, 3],
        m3: (i) => i * 4200,
        on: (i) => 43 + i * 17,
        pct: (i) => 20 + i * 5,
        cyc: (i, f) => (i === 1 && f === 1) || (i === 2 && f === 2) || (i === 4 && f === 0),
      },
      extra: {
        n: 6,
        pre: 'P',
        fans: [0, 1, 2, 3, 4, 5],
        m3: (i) => 28000 + i * 6000,
        on: (i) => 120 + i * 20,
        pct: (i) => 50 + i * 10,
        cyc: (i, f) => f > 3 + Math.floor(i / 2),
      },
      tunnel: { n: 6, pre: 'T', fans: [6, 7, 8, 9], m3: (i) => 70000 + i * 14000, on: (i) => 300, pct: (i) => 50 + i * 10, cyc: (i, f) => f - 6 > i },
    }[pt];
    const rows = Array.from({ length: P.n }, (_, i) => ({
      k: P.pre + (i + 1),
      m3: P.m3(i).toLocaleString('en-US'),
      on: P.on(i),
      row: {
        display: 'grid',
        gridTemplateColumns: '84px 64px repeat(10,minmax(52px,1fr))',
        borderBottom: '1px solid var(--color-divider)',
        ...(i === cur ? { boxShadow: 'inset 3px 0 0 var(--color-accent)', background: 'var(--color-accent-100)' } : {}),
      },
      cells: Array.from({ length: 10 }, (_, f) => {
        const has = P.fans.includes(f),
          c = has && P.cyc(i, f);
        return {
          has,
          pct: Math.min(100, P.pct(i)) + ' %',
          ring: {
            width: 30,
            height: 30,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: c ? 'transparent' : 'var(--color-accent-900)',
            color: c ? 'var(--color-accent-900)' : '#fff',
            border: '1.5px solid var(--color-accent-900)',
          },
        };
      }),
    }));
    const sel = { background: 'var(--color-accent)', color: '#fff' };
    return {
      tabs: [
        ['basic', 'Basic'],
        ['extra', 'Extra ventilation'],
        ['tunnel', 'Tunnel'],
      ].map(([k, l]) => ({ label: l, pick: () => this.setState({ progTab: k }), style: pt === k ? sel : {} })),
      fanCols: Array.from({ length: 10 }, (_, i) => ({ k: i + 1 })),
      rows,
    };
  }
  mapVals(m): any {
    if (!m) return { hasMap: false, noMap: true };
    const K = [...['L', 'P', 'T'].flatMap((p) => [1, 2, 3, 4, 5, 6].map((n) => p + n))];
    const steps = K.map((k, i) => {
      const n = i + 1,
        on = n <= m.cur,
        cur = n === m.cur,
        mm = n === m.min ? 'Min' : n === m.max ? 'Max' : '';
      return {
        k,
        mm,
        bar: {
          flex: 1,
          height: 28 + (i / 17) * 72 + '%',
          boxSizing: 'border-box',
          background: on ? `color-mix(in srgb,var(--color-accent-700) ${Math.round(25 + (i / 17) * 75)}%,var(--color-accent-100))` : 'var(--color-neutral-200)',
          outline: cur ? '2px solid var(--color-text)' : 'none',
          outlineOffset: 1,
        },
        lab: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: cur ? 700 : 400, color: cur ? 'var(--color-text)' : 'var(--color-neutral-700)' },
        mmS: {
          flex: 1,
          textAlign: 'center',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '.04em',
          textTransform: 'uppercase',
          color: 'var(--color-accent-900)',
          visibility: mm ? 'visible' : 'hidden',
        },
      };
    });
    let run = 0,
      tot = 0;
    const groups = m.fans.map((g) => {
      const f = g.f.map(([k, on]) => {
        tot++;
        if (on) run++;
        const pct = on === true || on === 1 ? 100 : on;
        return {
          k,
          st: !on ? 'OFF' : pct >= 100 ? 'ON' : pct + '%',
          isOn: !!on,
          tile: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: this.state.compact ? 2 : 3,
            padding: this.state.compact ? '3px 2px' : '5px 2px',
            minWidth: 0,
            border: '1px solid ' + (on ? 'var(--color-accent-300)' : 'var(--color-divider)'),
            background: on ? 'var(--color-accent-100)' : 'transparent',
          },
          svg: { width: 22, height: 22, display: this.state.compact ? 'none' : 'block', color: on ? 'var(--color-accent-700)' : 'var(--color-neutral-400)' },
          spin: {
            transformBox: 'fill-box',
            transformOrigin: 'center',
            animation: on ? `dfan ${((1.1 * 100) / Math.max(20, pct)).toFixed(2)}s linear infinite` : 'none',
          },
          chip: {
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '.04em',
            padding: '0 5px',
            background: on ? 'var(--color-accent)' : 'var(--color-neutral-200)',
            color: on ? '#fff' : 'var(--color-neutral-600)',
          },
        };
      });
      const span = Math.min(6, f.length); // eslint-disable-line @typescript-eslint/no-unused-vars
      void span;
      return {
        t: g.t,
        f,
        n: f.length,
        on: f.filter((x) => x.isOn).length,
        wrap: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, ...(this.state.compact ? { flex: f.length >= 6 ? '1 1 100%' : f.length + ' 1 0' } : {}) },
        grid: { display: 'grid', gridTemplateColumns: `repeat(${this.state.compact ? (f.length >= 6 ? 6 : f.length) : 6},minmax(0,1fr))`, gap: 3 },
      };
    });
    const scheme: any[] = [];
    {
      const by = (t) => (m.fans.find((g) => g.t.toLowerCase().startsWith(t)) || { f: [] }).f;
      const add = (k, on, cx, cy, sz, arrow, tx, ty, ta) =>
        scheme.push({
          k,
          x: cx - sz / 2,
          y: cy - sz / 2,
          s: sz,
          arrow,
          tx,
          ty,
          ta,
          col: { color: on ? 'var(--color-accent-700)' : 'var(--color-neutral-400)' },
          tc: on ? 'var(--color-accent-900)' : 'var(--color-neutral-600)',
          labS: {
            position: 'absolute',
            left: (((tx - 26) / 594) * 100).toFixed(2) + '%',
            top: ((ty / 230) * 100).toFixed(2) + '%',
            transform: `translate(${ta === 'end' ? '-100%' : ta === 'middle' ? '-50%' : '0'},-80%)`,
            fontSize: 'max(11px,1.85cqw)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            color: on ? 'var(--color-accent-900)' : 'var(--color-neutral-600)',
          },
          arrS: { opacity: on ? 1 : 0 },
          spin: { transformBox: 'fill-box', transformOrigin: 'center', animation: on ? 'dfan 1.1s linear infinite' : 'none' },
        });
      const side = by('side'),
        half = Math.ceil(side.length / 2);
      side.forEach(([k, on], i) => {
        const top = i < half,
          j = top ? i : i - half,
          cx = 50 + (520 * (j + 1)) / (half + 1),
          cy = top ? 45 : 185;
        add(k, on, cx, cy, 30, top ? `M${cx} 28V8M${cx - 5} 13l5-5 5 5` : `M${cx} 202v20M${cx - 5} 217l5 5 5-5`, cx + 20, top ? 36 : 204, 'start');
      });
      const tun = by('tunnel');
      tun.forEach(([k, on], i) => {
        const cy = 45 + (140 * (i + 0.5)) / tun.length;
        add(k, on, 570, cy, 24, `M584 ${cy}h22M600 ${cy - 5}l6 5-6 5`, 556, cy + 4, 'end');
      });
      const stir = by('stir');
      stir.forEach(([k, on], i) => {
        const cx = 50 + (520 * (i + 1)) / (stir.length + 1) - 30,
          cy = 115;
        add(k, on, cx, cy, 30, `M${cx + 18} ${cy}h34M${cx + 46} ${cy - 6}l6 6-6 6`, cx, cy - 22, 'middle');
      });
    }
    const inl: any[] = [];
    (m.inlets || []).forEach(([t, items], gi) =>
      items.forEach(([k, v, al], j) => {
        const top = gi === 0,
          left = j === 0;
        inl.push({
          k,
          v: v + '%',
          box: {
            position: 'absolute',
            left: ((((left ? 50 : 570) - 26) / 594) * 100).toFixed(2) + '%',
            top: (((top ? 45 : 185) / 230) * 100).toFixed(2) + '%',
            transform: `translate(${left ? '0' : '-40%'},${top ? 'calc(-100% - 4px)' : '4px'})`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6cqw',
            padding: '0.4cqw 1cqw',
            fontSize: 'max(11px,1.85cqw)',
            background: 'var(--color-neutral-200)',
            border: '1px solid ' + (al ? '#e0a39c' : 'transparent'),
            pointerEvents: 'none',
          },
          ic: { flex: 'none', transform: top ? 'rotate(90deg)' : 'rotate(-90deg)', color: al ? '#b3261e' : v > 0 ? 'var(--color-accent-800)' : 'var(--color-neutral-400)' },
          air: { opacity: v > 0 ? 1 : 0 },
          vS: { fontFamily: 'var(--font-heading)', fontSize: 'max(14px,2.6cqw)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: al ? '#b3261e' : 'var(--color-text)' },
        });
      }),
    );
    const tileOf = ([k, v, al]) => ({
      k,
      v,
      tile: { display: 'flex', flexDirection: 'column', gap: 4, padding: 8, border: '1px solid ' + (al ? '#e0a39c' : 'var(--color-divider)'), background: al ? '#fdecea' : 'transparent' },
      vS: {
        fontFamily: 'var(--font-heading)',
        fontSize: 22,
        fontWeight: 600,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        color: al ? '#b3261e' : v ? 'var(--color-text)' : 'var(--color-neutral-500)',
      },
      bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: v + '%', background: al ? '#b3261e' : 'var(--color-accent-700)' },
    });
    const sides = m.inlets.map(([t, f]) => ({ t, f: f.map(tileOf) }));
    const N = 18,
      re = 13,
      H = (i) => (30 + (70 * (i + 1)) / N).toFixed(1) + '%';
    const gSegs = K.map((_, i) => ({
      flex: '1 1 0',
      minWidth: 0,
      position: 'relative',
      zIndex: 1,
      alignSelf: 'flex-end',
      height: H(i),
      background: i === m.cur - 1 ? 'var(--color-accent-700)' : 'var(--color-neutral-300)',
    }));
    const gRange = {
      position: 'absolute',
      left: `calc(${(m.min / N) * 100}% - 3px)`,
      width: `calc(${((re - m.min) / N) * 100}% + 2px)`,
      top: -4,
      bottom: -13,
      background: 'var(--color-accent-200)',
      pointerEvents: 'none',
    };
    const gHandle = {
      position: 'absolute',
      left: `calc(${(((m.cur - 0.5) / N) * 100).toFixed(2)}% - 1px)`,
      top: -12,
      transform: 'translateX(-50%)',
      width: 14,
      height: 26,
      boxSizing: 'border-box',
      border: '1.5px solid var(--color-text)',
      borderRadius: 2,
      background: 'var(--color-bg)',
      boxShadow: '0 1px 3px rgba(0,0,0,.25)',
      zIndex: 3,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
    const gGroups = ([
      ['Basic', 0],
      ['Power', 6],
      ['Tunnel', 12],
    ] as any[]).map(([t, a]) => {
      const act = m.cur > a && m.cur <= a + 6;
      return {
        t,
        style: { borderTop: '3px solid var(--color-accent-800)', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 },
        nameS: { fontSize: 14, fontWeight: act ? 700 : 500, color: 'var(--color-accent-900)', whiteSpace: 'nowrap' },
        levels: K.slice(a, a + 6).map((k, j) => {
          const n = a + j + 1,
            c = n === m.cur;
          return {
            k,
            s: {
              flex: '1 1 0',
              minWidth: 0,
              textAlign: 'center',
              fontSize: 12,
              fontVariantNumeric: 'tabular-nums',
              fontWeight: c ? 700 : 500,
              color: c ? 'var(--color-accent-900)' : 'var(--color-neutral-700)',
            },
          };
        }),
      };
    });
    return {
      hasMap: true,
      noMap: false,
      map: { inl, scheme, gSegs, gRange, gHandle, gGroups, level: K[m.cur - 1], mode: m.mode, output: m.output, running: run, total: tot, steps, groups, sides },
    };
  }
  tabVals(w, d, s, seed): any {
    const n = d.notes || {},
      pct = 55 + (seed % 38),
      gap = (seed % 7) + 2,
      tl = (w.title || '').toLowerCase();
    const tab = s.tab,
      TT = [
        ['overview', 'Overview'],
        ['history', 'History'],
        ['market', 'Market comparison'],
      ];
    const ai =
      tab === 'overview'
        ? (d.insights || []).map((i) => ({ k: i[0], t: i[1] }))
        : tab === 'history'
          ? [
              n.trend && { k: 'Trend', t: n.trend },
              n.compare && { k: 'vs last flock', t: n.compare },
              { k: 'Suggestion', t: `The pattern repeats on most days. Schedule a check of ${tl} settings before the next flock-age step.` },
            ].filter(Boolean)
          : [
              n.bench && { k: 'Benchmark', t: n.bench },
              { k: 'Where you stand', t: `House 3 is in the ${pct}th percentile for ${tl} among 240 comparable farms.` },
              {
                k: 'Suggestion',
                t: `Top-quartile farms hold ${tl} closer to target in the early-morning hours. Matching that would close about ${gap}% of the gap.`,
              },
            ].filter(Boolean);
    return {
      tabOverview: tab === 'overview',
      tabHistory: tab === 'history',
      tabMarket: tab === 'market',
      ai: this.state.compact && (d.map || w.press) ? ai.slice(0, 1) : ai,
      aiBasis: tab === 'overview' ? 'Based on live readings' : tab === 'history' ? 'Based on 28 days + last flock' : 'Based on 240 farms · anonymised',
      market: [
        ['Market percentile', pct + 'th', '240 farms · same breed'],
        ['vs market average', (pct > 70 ? '+' : '') + ((pct - 50) / 4).toFixed(1) + '%', 'this flock'],
        ['Gap to top 25%', pct >= 75 ? '—' : 75 - pct + ' pts', 'percentile points'],
      ].map((k) => ({ k: k[0], v: k[1], s: k[2] })),
      tabs: TT.map(([k, l]) => ({
        label: l,
        pick: () => this.setState({ tab: k }),
        style: {
          background: 'none',
          border: 'none',
          borderBottom: '2px solid ' + (tab === k ? 'var(--color-accent)' : 'transparent'),
          padding: '12px 14px 10px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 14,
          fontWeight: tab === k ? 600 : 500,
          color: tab === k ? 'var(--color-text)' : 'var(--color-neutral-700)',
          marginBottom: -1,
        },
      })),
    };
  }
  renderVals(): any {
    const p: any = this.props,
      w = p.w || { title: '', d: {} },
      d = w.d || {},
      s0 = this.state,
      mode = s0.tab === 'market' ? 'bench' : s0.mode,
      s = { ...s0, mode },
      c = w.chart || { lo: 0, hi: 1, tLo: 0.4, tHi: 0.6, dp: 0 };
    const inSettings = s.view === 'settings',
      inOrder = s.view === 'order',
      inProgram = s.view === 'program',
      inMinMax = s.view === 'minmax',
      flock = s.mode !== 'trend' || s.range === 'flock';
    const n = s.mode !== 'trend' ? 29 : s.range === '24h' ? 25 : s.range === '7d' ? 28 : 29;
    const seed = (w.id || 'x').length * 17 + (w.id || 'x').charCodeAt(0);
    const y = (v) => 200 - ((v - c.lo) / (c.hi - c.lo)) * 200,
      fmt = (v) => Number(v.toFixed(c.dp)).toLocaleString('en-US', { minimumFractionDigits: c.dp, maximumFractionDigits: c.dp });
    const st = w.status;
    const sel = { background: 'var(--color-accent-100)', color: 'var(--color-accent-900)' };
    const wide = !!p.wide,
      ch = wide ? 280 : 200;
    return {
      rootStyle: {
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        ...(wide ? {} : { boxShadow: 'var(--shadow-lg)', borderLeft: '1px solid var(--color-divider)' }),
      },
      rootRef: this.rootRef,
      insRow: 'auto',
      colGap: this.state.compact ? 8 : 24,
      mapCol: '1 / -1',
      statSubD: this.state.compact ? 'none' : 'inline',
      statFs: this.state.compact ? 24 : 44,
      gH: this.state.compact ? 24 : 72,
      schemeMax: this.state.compact ? '430px' : 'none',
      schemeMin: this.state.compact ? '300px' : '420px',
      invFlex: this.state.compact ? '0 1 330px' : '0 0 260px',
      invDir: this.state.compact ? 'row' : 'column',
      invAlign: this.state.compact ? 'flex-start' : 'auto',
      pgMax: this.state.compact ? '300px' : '560px',
      pgLegD: this.state.compact ? 'none' : 'flex',
      pgRow: this.state.compact ? { display: 'flex', gap: 16, alignItems: 'center' } : { display: 'flex', flexDirection: 'column', gap: 16 },
      pgCards: this.state.compact
        ? { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, flex: '0 0 230px' }
        : { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 },
      detailStyle: wide
        ? {
            flex: 1,
            overflow: 'auto',
            padding: this.state.compact ? '8px 20px' : '24px 28px',
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1.55fr) minmax(0,1fr)',
            gap: this.state.compact ? '6px 24px' : 32,
            alignItems: 'start',
          }
        : { flex: 1, overflow: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 },
      siloGrid: { display: 'grid', gridTemplateColumns: `repeat(${wide ? 4 : 2},minmax(0,1fr))`, gap: 12 },
      chartBox: { height: ch, position: 'relative' },
      yAxis: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontSize: 10,
        color: 'var(--color-neutral-700)',
        height: ch,
        textAlign: 'right',
        width: 44,
        flex: 'none',
      },
      w,
      d,
      onClose: p.onClose,
      inSettings,
      inOrder,
      inProgram,
      inMinMax,
      inSub: inSettings || inOrder || inProgram || inMinMax,
      inDetail: !inSettings && !inOrder && !inProgram && !inMinMax,
      crumbText:
        (p.crumb || 'House 3') +
        ' › ' +
        (inSettings ? d.path : inOrder ? 'Silos' : inProgram ? 'Ventilation › Program' : inMinMax ? 'Ventilation › Min / Max' : d.map ? 'Ventilation' : w.title),
      titleText: inSettings
        ? 'Configure ' + w.title
        : inOrder
          ? 'Order feed delivery'
          : inProgram
            ? 'Ventilation program'
            : inMinMax
              ? 'Min / Max ventilation'
              : d.map
                ? 'Ventilation'
                : w.title,
      prog: this.progVals(s),
      ventHead: !!d.map,
      notVent: !d.map,
      showSubs: !d.silos && !d.map,
      toProgram: () => this.setState({ view: 'program' }),
      toMinMax: () => this.setState({ view: 'minmax' }),
      minmax: ([
        [0, '70 %'],
        [3, '80 %'],
        [7, '85 %'],
        [9, '90 %'],
        [14, '11'],
        [18, '12'],
        [28, '14'],
        [30, '16'],
      ] as any[]).map(([day, min], i, a) => {
        const cur = day <= 28 && (a[i + 1] ? a[i + 1][0] > 28 : true);
        return {
          day,
          min,
          max: 'T 10',
          row: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
            textAlign: 'center',
            fontSize: 15,
            fontVariantNumeric: 'tabular-nums',
            borderBottom: '1px solid var(--color-divider)',
            ...(cur ? { background: 'var(--color-accent-100)', boxShadow: 'inset 3px 0 0 var(--color-accent)' } : {}),
          },
        };
      }),
      ...this.siloVals(d, s),
      ...this.mapVals(d.map),
      ...this.tmapVals(d.tmap),
      ...this.wfVals(d.wfmap),
      ...this.lmVals(d.lmap),
      ...this.bmVals(d.bmap),
      ...this.pgVals(w.press, s),
      showValRow: !d.map && !d.tmap && !d.wfmap && !d.lmap && !d.bmap && !w.press,
      cfgClass: d.silos ? 'btn btn-secondary blueprint' : 'btn btn-primary blueprint',
      tagClass: st === 'alert' ? 'tag' : st === 'watch' ? 'tag tag-outline' : 'tag tag-neutral',
      tagStyle: st === 'alert' ? { background: '#b3261e', color: '#fff' } : {},
      perf: (d.perf || []).map((k) => ({ k: k[0], v: k[1], s: k[2] })),
      modes: [
        ['trend', 'Over time'],
        ['compare', 'vs last flock'],
      ].map(([k, l]) => ({ label: l, pick: () => this.setState({ mode: k }), style: s.mode === k ? sel : {} })),
      showModes: s.tab === 'history',
      showRange: s.mode === 'trend' && s.tab === 'history',
      ...this.tabVals(w, d, s, seed),
      ranges: [
        ['24h', '24 h'],
        ['7d', '7 days'],
        ['flock', 'Flock'],
      ].map(([k, l]) => ({ label: l, pick: () => this.setState({ range: k }), style: s.range === k ? sel : {} })),
      bandY: y(c.tHi).toFixed(1),
      bandH: (y(c.tLo) - y(c.tHi)).toFixed(1),
      main: this.series(seed, n, c, flock, false),
      cmp:
        s.mode === 'compare'
          ? this.series(seed + 7, n, { ...c, tLo: c.tLo * 0.98, tHi: c.tHi * 1.03 }, true, false)
          : s.mode === 'bench'
            ? this.series(seed + 3, n, c, true, true)
            : '',
      yLabels: [c.hi, (c.hi + c.lo) / 2, c.lo].map((v) => ({ t: fmt(v) })),
      xLabels: (s.mode !== 'trend' || s.range === 'flock'
        ? ['Day 0', 'Day 7', 'Day 14', 'Day 21', 'Day 28']
        : s.range === '7d'
          ? ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Today']
          : ['00:00', '06:00', '12:00', '18:00', 'Now']
      ).map((t) => ({ t })),
      legend: [
        { t: 'House 3', sw: { width: 16, height: 2, background: 'var(--color-accent-700)' } },
        ...(s.mode === 'compare' ? [{ t: d.compareLabel || 'Last flock', sw: { width: 16, height: 0, borderTop: '2px dashed var(--color-neutral-600)' } }] : []),
        ...(s.mode === 'bench' ? [{ t: d.benchLabel || 'Benchmark', sw: { width: 16, height: 0, borderTop: '2px dashed var(--color-neutral-600)' } }] : []),
        { t: 'Target band (' + (c.unit || '') + ')', sw: { width: 16, height: 10, background: 'var(--color-accent-100)' } },
      ],
      chartNote: (d.notes || {})[s.mode] || '',
      subs: (d.subs || []).map(([k, v, state, note]) => ({
        k,
        v,
        note,
        hasNote: !!note,
        tag: state === 'alert' ? 'Alarm' : state === 'watch' ? 'Watch' : 'OK',
        tagClass: state === 'alert' ? 'tag' : state === 'watch' ? 'tag tag-outline' : 'tag tag-neutral',
        tagStyle: state === 'alert' ? { background: '#b3261e', color: '#fff' } : {},
        box: {
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: state === 'ok' ? '8px 0' : '10px 12px',
          borderBottom: state === 'ok' ? '1px solid var(--color-divider)' : 'none',
          background: state === 'alert' ? '#fdecea' : state === 'watch' ? 'var(--color-accent-100)' : 'transparent',
        },
        noteStyle: { fontSize: 12, color: state === 'alert' ? '#8c1d18' : 'var(--color-accent-900)' },
      })),
      insights: (d.insights || []).map((i) => ({ k: i[0], t: i[1] })),
      groups: (d.settings || []).map((g) => ({ t: g.t, f: g.f.map((f) => ({ k: f[0], v: f[1] })) })),
      toSettings: () => this.setState({ view: 'settings' }),
      back: () => this.setState({ view: 'detail' }),
    };
  }

  /* ---------- template pieces shared between tabs ---------- */

  renderInsights(v: any) {
    return (
      <div
        style={S(
          'display:flex;flex-direction:column;gap:10px;padding:16px;border:1px solid transparent;background:linear-gradient(120deg,#eef6ff,#f4efff 55%,#fff0f6) padding-box,linear-gradient(120deg,#7cc4f7,#a98bff,#ff9ec9) border-box',
        )}
      >
        <div style={S('display:flex;align-items:center;gap:8px')}>
          <span
            style={S(
              'width:22px;height:22px;display:grid;place-items:center;color:#fff;font-size:12px;background:linear-gradient(135deg,#4a9be8,#8b6cf2,#e0609f)',
            )}
          >
            ✦
          </span>
          <span style={S('font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5b3fc4')}>Insights</span>
          <span style={S('margin-left:auto;font-size:11px;color:var(--color-neutral-700)')}>{tx(v.aiBasis)}</span>
        </div>
        {(v.ai || []).map((n: any, i: number) => (
          <div key={i} style={S('display:flex;flex-direction:column;gap:3px;padding:10px 12px;background:rgba(255,255,255,.7)')}>
            <span style={S('font-size:11px;font-weight:600;color:#5b3fc4')}>{tx(n.k)}</span>
            <span style={S('font-size:13px;line-height:1.5')}>{tx(n.t)}</span>
          </div>
        ))}
      </div>
    );
  }

  renderChart(v: any) {
    return (
      <div style={S('display:flex;flex-direction:column;gap:10px')}>
        <div style={S('display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap')}>
          {v.showModes ? (
            <div className="seg">
              {v.modes.map((m: any, i: number) => (
                <label key={i} className="seg-opt" onClick={m.pick} style={m.style}>
                  {tx(m.label)}
                </label>
              ))}
            </div>
          ) : null}
          {v.tabMarket ? (
            <span style={S('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-700)')}>
              You vs market · same breed &amp; flock age
            </span>
          ) : null}
          {v.showRange ? (
            <div className="seg">
              {v.ranges.map((g: any, i: number) => (
                <label key={i} className="seg-opt" onClick={g.pick} style={g.style}>
                  {tx(g.label)}
                </label>
              ))}
            </div>
          ) : null}
        </div>
        <div style={S('display:flex;gap:8px')}>
          <div style={v.yAxis}>
            {v.yLabels.map((y: any, i: number) => (
              <span key={i}>{tx(y.t)}</span>
            ))}
          </div>
          <div style={S('flex:1;display:flex;flex-direction:column;gap:4px;min-width:0')}>
            <div className="blueprint" style={v.chartBox}>
              <Corners />
              <svg viewBox="0 0 600 200" preserveAspectRatio="none" style={S('width:100%;height:100%;display:block')}>
                <rect x="0" y={v.bandY} width="600" height={v.bandH} fill="var(--color-accent-100)"></rect>
                <polyline
                  points={v.cmp}
                  fill="none"
                  stroke="var(--color-neutral-600)"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  vectorEffect="non-scaling-stroke"
                ></polyline>
                <polyline points={v.main} fill="none" stroke="var(--color-accent-700)" strokeWidth="2" vectorEffect="non-scaling-stroke"></polyline>
              </svg>
            </div>
            <div style={S('display:flex;justify-content:space-between;font-size:10px;color:var(--color-neutral-700)')}>
              {v.xLabels.map((x: any, i: number) => (
                <span key={i}>{tx(x.t)}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={S(`display:${tx(v.pgLegD)};gap:16px;flex-wrap:wrap;font-size:11px;color:var(--color-neutral-700)`)}>
          {v.legend.map((l: any, i: number) => (
            <span key={i} style={S('display:flex;align-items:center;gap:6px')}>
              <span style={l.sw}></span>
              {tx(l.t)}
            </span>
          ))}
        </div>
      </div>
    );
  }

  renderOverview(v: any) {
    const { w, pg, bm, lm, wf, tm, map } = v;
    return (
      <div style={v.detailStyle}>
        <div style={S(`display:flex;flex-direction:column;gap:${tx(v.colGap)}px;min-width:0`)}>
          {v.showValRow ? (
            <div style={S('display:flex;align-items:baseline;gap:8px;flex-wrap:wrap')}>
              <span style={S('font-family:var(--font-heading);font-size:52px;font-weight:600;line-height:1;font-variant-numeric:tabular-nums')}>{tx(w.value)}</span>
              <span style={S('color:var(--color-neutral-700)')}>{tx(w.unit)}</span>
              <span style={S('font-size:13px;color:var(--color-neutral-700);flex-basis:100%')}>{tx(w.note)}</span>
            </div>
          ) : null}
          {v.hasPG ? (
            <div style={S('display:flex;flex-direction:column;gap:16px')}>
              <div style={S('display:flex;justify-content:flex-end')}>
                <div className="seg">
                  {pg.sims.map((m: any, i: number) => (
                    <label key={i} className="seg-opt" onClick={m.pick} style={m.style}>
                      {tx(m.label)}
                    </label>
                  ))}
                </div>
              </div>
              <div style={v.pgRow}>
                <div
                  style={S(
                    `position:relative;width:100%;max-width:${tx(v.pgMax)};align-self:center;aspect-ratio:400 / 250;flex:1 1 0;min-width:0`,
                  )}
                >
                  <svg viewBox="0 0 400 250" style={S('position:absolute;inset:0;width:100%;height:100%;display:block;overflow:visible')}>
                    <path d={pg.track} fill="none" stroke="var(--color-accent-100)" strokeWidth="34"></path>
                    <path d={pg.lowZ} fill="none" stroke="#f2bdb4" strokeWidth="34"></path>
                    <path d={pg.highZ} fill="none" stroke="#f2bdb4" strokeWidth="34"></path>
                    <path d={pg.okZ} fill="none" stroke="var(--color-accent-500)" strokeWidth="34"></path>
                    {pg.minor.map((t: any, i: number) => (
                      <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="var(--color-neutral-500)" strokeWidth="1"></line>
                    ))}
                    {pg.major.map((t: any, i: number) => (
                      <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="var(--color-neutral-800)" strokeWidth="1.5"></line>
                    ))}
                    {pg.limits.map((t: any, i: number) => (
                      <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#b3261e" strokeWidth="2" strokeDasharray="3 2"></line>
                    ))}
                    <line x1={pg.tx1} y1={pg.ty1} x2={pg.tx2} y2={pg.ty2} stroke="var(--color-text)" strokeWidth="5"></line>
                    {pg.ok ? (
                      <line x1={pg.nbx} y1={pg.nby} x2={pg.nx} y2={pg.ny} stroke={pg.needle} strokeWidth="5" strokeLinecap="round"></line>
                    ) : null}
                  </svg>
                  {pg.labels.map((l: any, i: number) => (
                    <span key={i} style={l.s}>
                      {tx(l.t)}
                    </span>
                  ))}
                  <div style={S('position:absolute;left:0;right:0;top:66%;display:flex;flex-direction:column;align-items:center;gap:2px')}>
                    <div style={S('display:flex;align-items:baseline;gap:4px')}>
                      <span style={pg.vS}>{tx(pg.vTxt)}</span>
                      <span style={S('font-family:var(--font-heading);font-size:20px;font-weight:600;color:var(--color-neutral-700)')}>Pa</span>
                    </div>
                    <span style={pg.subS}>{tx(pg.sub)}</span>
                  </div>
                </div>
                <div style={v.pgCards}>
                  {pg.vals.map((t: any, i: number) => (
                    <div key={i} className="blueprint" style={S('padding:12px;display:flex;flex-direction:column;gap:2px;min-width:0')}>
                      <Corners />
                      <span style={S('font-size:11px;color:var(--color-neutral-700)')}>{tx(t.k)}</span>
                      <span style={t.vS}>
                        {tx(t.v)}
                        <span style={S('font-size:13px;color:var(--color-neutral-700)')}>{' ' + tx(t.u)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={S(`display:${tx(v.pgLegD)};gap:16px;flex-wrap:wrap;font-size:11px;color:var(--color-neutral-700)`)}>
                <span style={S('display:flex;align-items:center;gap:6px')}>
                  <span style={S('width:14px;height:8px;background:var(--color-accent-500)')}></span>Target band
                </span>
                <span style={S('display:flex;align-items:center;gap:6px')}>
                  <span style={S('width:14px;height:8px;background:#f2bdb4')}></span>Alarm zone
                </span>
                <span style={S('display:flex;align-items:center;gap:6px')}>
                  <span style={S('width:4px;height:12px;background:var(--color-text)')}></span>Target
                </span>
                <span style={S('display:flex;align-items:center;gap:6px')}>
                  <span style={S('width:0;height:12px;border-left:2px dashed #b3261e')}></span>Alarm limit
                </span>
              </div>
            </div>
          ) : null}
          {v.hasBM ? (
            <>
              <div style={S('display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px')}>
                {bm.stats.map((t: any, i: number) => (
                  <div key={i} style={S('display:flex;flex-direction:column;gap:2px;min-width:0')}>
                    <span style={S('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-700)')}>{tx(t.k)}</span>
                    <span style={S('font-family:var(--font-heading);font-size:34px;font-weight:600;line-height:1;white-space:nowrap;font-variant-numeric:tabular-nums')}>
                      {tx(t.v)}
                      <span style={S('font-size:15px;color:var(--color-neutral-700)')}>{' ' + tx(t.u)}</span>
                    </span>
                    <span style={S('font-size:12px;color:var(--color-neutral-700)')}>{tx(t.s)}</span>
                  </div>
                ))}
              </div>
              <div style={S('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px')}>
                {bm.sexes.map((x: any, i: number) => (
                  <div key={i} style={x.card}>
                    <div style={S('display:flex;align-items:center;gap:16px;height:124px')}>
                      <svg viewBox="0 0 120 120" style={S('width:118px;height:118px;flex:none')}>
                        <circle cx="60" cy="60" r="56" fill={x.halo}></circle>
                        <path d="M84 70c10-6 16-18 14-30-6 6-12 8-18 8" fill={x.tail} style={x.showTail}></path>
                        <path d="M88 76c12-2 20-12 22-24-7 4-14 5-20 4" fill={x.tail2} style={x.showTail}></path>
                        <ellipse cx="58" cy="74" rx="30" ry="26" fill={x.body}></ellipse>
                        <circle cx="52" cy="46" r="20" fill={x.body}></circle>
                        <path d={x.comb} fill="#e0473a"></path>
                        <path d="M34 46l-10 4 10 4z" fill="#f2a33a"></path>
                        <path d="M38 56c-2 4 0 9 4 9 2-3 1-7-4-9z" fill="#e0473a" style={x.showTail}></path>
                        <path d={x.eye} fill="none" stroke="#1d1f20" strokeWidth="2.6" strokeLinecap="round"></path>
                        <circle cx="56" cy="54" r="3.5" fill="#f6a3a3" opacity=".7"></circle>
                        <path d="M62 74c8 6 18 6 24-2-8 2-16 2-24 2z" fill={x.wing}></path>
                        <path d="M50 99v8M64 99v8M46 107h8M60 107h8" stroke="#f2a33a" strokeWidth="2.6" strokeLinecap="round"></path>
                      </svg>
                      <div style={S('display:flex;flex-direction:column;gap:4px;min-width:0')}>
                        <span style={S('font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-700)')}>
                          {tx(x.k)} · {tx(x.countT)} birds
                        </span>
                        <div style={S('display:flex;align-items:baseline;gap:6px')}>
                          <span style={x.scoreS}>{tx(x.score)}</span>
                          <span style={S('font-size:13px;color:var(--color-neutral-700)')}>/ 100 health</span>
                        </div>
                        <span style={x.moodS}>{tx(x.mood)}</span>
                        <span style={S('font-size:12px;color:var(--color-neutral-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{tx(x.act)}</span>
                      </div>
                    </div>
                    <div
                      style={S(
                        'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;border-top:1px solid var(--color-divider);padding-top:10px;margin-top:auto;height:58px;box-sizing:border-box',
                      )}
                    >
                      {x.kpis.map((q: any, j: number) => (
                        <div key={j} style={S('display:flex;flex-direction:column;gap:1px;min-width:0')}>
                          <span style={S('font-size:10px;color:var(--color-neutral-700);white-space:nowrap')}>{tx(q.k)}</span>
                          <span style={S('font-family:var(--font-heading);font-size:20px;font-weight:600;line-height:1.1;font-variant-numeric:tabular-nums;white-space:nowrap')}>
                            {tx(q.v)}
                          </span>
                          <span style={q.sS}>{tx(q.s)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={S('display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:20px')}>
                <div style={S('display:flex;flex-direction:column;gap:6px')}>
                  <div style={S('display:flex;justify-content:space-between;align-items:baseline')}>
                    <span style={S('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-700)')}>Growth vs breed curve</span>
                    <span style={S('font-size:11px;color:var(--color-neutral-700);display:flex;gap:10px')}>
                      <span style={S('color:var(--color-accent-800)')}>━ Male</span>
                      <span style={S('color:#c2557a')}>━ Female</span>
                      <span>┄ Ross 308</span>
                    </span>
                  </div>
                  <div className="blueprint" style={S('height:180px;padding:10px;position:relative')}>
                    <Corners />
                    <svg viewBox="0 0 400 140" preserveAspectRatio="none" style={S('width:100%;height:100%')}>
                      <polyline
                        points={bm.gCurve}
                        fill="none"
                        stroke="var(--color-neutral-500)"
                        strokeWidth="1.5"
                        strokeDasharray="5 4"
                        vectorEffect="non-scaling-stroke"
                      ></polyline>
                      <polyline points={bm.gMale} fill="none" stroke="var(--color-accent-800)" strokeWidth="2.5" vectorEffect="non-scaling-stroke"></polyline>
                      <polyline points={bm.gFemale} fill="none" stroke="#c2557a" strokeWidth="2.5" vectorEffect="non-scaling-stroke"></polyline>
                    </svg>
                  </div>
                  <div style={S('display:flex;justify-content:space-between;font-size:10px;color:var(--color-neutral-700)')}>
                    {bm.gDays.map((g: any, i: number) => (
                      <span key={i}>{tx(g)}</span>
                    ))}
                  </div>
                </div>
                <div style={S('display:flex;flex-direction:column;gap:6px')}>
                  <div style={S('display:flex;justify-content:space-between;align-items:baseline')}>
                    <span style={S('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-700)')}>Weight distribution · kg</span>
                    <span style={S('font-size:11px;color:var(--color-neutral-700)')}>scale sample, today</span>
                  </div>
                  <div style={S('display:flex;align-items:flex-end;gap:6px;height:180px;border-bottom:1px solid var(--color-neutral-400)')}>
                    {bm.hist.map((b: any, i: number) => (
                      <div key={i} style={S('flex:1;height:100%;display:flex;align-items:flex-end;gap:1px')}>
                        <div style={b.m}></div>
                        <div style={b.f}></div>
                      </div>
                    ))}
                  </div>
                  <div style={S('display:flex;gap:6px;font-size:10px;color:var(--color-neutral-700)')}>
                    {bm.hist.map((b: any, i: number) => (
                      <span key={i} style={S('flex:1;text-align:center')}>
                        {tx(b.k)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={S('display:flex;flex-direction:column;gap:6px')}>
                <div style={S('display:flex;justify-content:space-between;align-items:baseline')}>
                  <span style={S('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-700)')}>Daily mortality · last 14 days</span>
                  <span style={S('font-size:11px;color:var(--color-neutral-700)')}>{tx(bm.mortNote)}</span>
                </div>
                <div style={S('display:flex;align-items:flex-end;gap:4px;height:70px;border-bottom:1px solid var(--color-neutral-400)')}>
                  {bm.mort.map((b: any, i: number) => (
                    <div key={i} style={b.style}>
                      <span style={S('font-size:10px;color:var(--color-neutral-700);position:absolute;top:-14px;left:0;right:0;text-align:center')}>{tx(b.v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
          {v.hasLM ? (
            <>
              <div style={S('display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px')}>
                {lm.stats.map((t: any, i: number) => (
                  <div key={i} style={S('display:flex;flex-direction:column;gap:2px;min-width:0')}>
                    <span style={S('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-700)')}>{tx(t.k)}</span>
                    <span style={S('font-family:var(--font-heading);font-size:34px;font-weight:600;line-height:1;white-space:nowrap')}>
                      {tx(t.v)}
                      <span style={S('font-size:15px;color:var(--color-neutral-700)')}>{' ' + tx(t.u)}</span>
                    </span>
                    <span style={S('font-size:12px;color:var(--color-neutral-700)')}>{tx(t.s)}</span>
                  </div>
                ))}
              </div>
              <div style={S('display:flex;flex-direction:column;gap:8px')}>
                <div style={S('display:flex;justify-content:space-between;align-items:baseline')}>
                  <span style={S('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-700)')}>Light map · top view</span>
                  <span style={S('font-size:11px;color:var(--color-neutral-700)')}>Lux per measuring point · target {tx(lm.target)} lux</span>
                </div>
                <div style={S('display:flex;flex-direction:column;gap:6px')}>
                  <div style={S('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-700);text-align:center')}>Entrance</div>
                  <div style={S('border:2px solid var(--color-text);background:#121314;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:12px')}>
                    {lm.rows.map((r: any, i: number) => (
                      <div key={i} style={S('display:flex;flex-direction:column;align-items:stretch;gap:8px;min-width:0')}>
                        <div style={S('display:flex;align-items:center;justify-content:center;gap:10px')}>
                          <div style={r.pill}>
                            <div style={r.pillFill}></div>
                            <svg
                              viewBox="0 0 24 24"
                              width="18"
                              height="18"
                              fill="none"
                              stroke={r.iconC}
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={S('position:relative;z-index:1;margin-top:8px')}
                            >
                              <path d="M12 2v4"></path>
                              <path d="M5 12a7 7 0 0 1 14 0Z"></path>
                              <path d="M10 15.5a2 2 0 0 0 4 0"></path>
                            </svg>
                          </div>
                          <div style={S('display:flex;flex-direction:column;line-height:1.15;color:#fff')}>
                            <span style={S('font-size:13px;font-weight:700')}>{tx(r.k)}</span>
                            <span style={S('font-size:11px;opacity:.75;white-space:nowrap')}>{tx(r.pillPct)}</span>
                          </div>
                        </div>
                        <div style={S('position:relative;height:240px;background:#1a1b1d;overflow:hidden')}>
                          <div style={S('position:absolute;left:0;right:0;top:0;height:3px;background:#2c2d30;z-index:2')}></div>
                          <div style={r.one.pool}>
                            <div style={r.one.fix}></div>
                            <span style={r.one.tS}>{tx(r.one.v)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={S('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-700);text-align:center')}>Tunnel end</div>
                </div>
                <div style={S('display:flex;align-items:center;gap:16px;font-size:11px;color:var(--color-neutral-700);flex-wrap:wrap')}>
                  <span style={S('display:flex;align-items:center;gap:6px')}>
                    <span style={S('width:14px;height:22px;border-radius:5px;background:linear-gradient(#3a3a3c 40%,#ffd59a 40%)')}></span>Row intensity
                  </span>
                  <span style={S('display:flex;align-items:center;gap:6px')}>
                    <span style={S('width:90px;height:8px;background:linear-gradient(90deg,#1a1b1d,#6b5a3a,#ffd59a)')}></span>Light pool = lux on floor
                  </span>
                  <span style={S('display:flex;align-items:center;gap:6px')}>
                    <span style={S('width:14px;height:2px;background:#e0473a')}></span>Below 15 lux
                  </span>
                </div>
              </div>
              <div style={S('display:flex;flex-direction:column')}>
                <div
                  style={S(
                    'display:grid;grid-template-columns:50px 70px minmax(0,1fr) 110px 90px 90px;gap:12px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--color-neutral-700);padding-bottom:6px;border-bottom:1px solid var(--color-divider)',
                  )}
                >
                  <span>Row</span>
                  <span>State</span>
                  <span>Colour</span>
                  <span style={S('text-align:right')}>Intensity</span>
                  <span style={S('text-align:right')}>Avg lux</span>
                  <span style={S('text-align:right')}>Min lux</span>
                </div>
                {lm.rows.map((r: any, i: number) => (
                  <div key={i} style={r.row}>
                    <b>{tx(r.k)}</b>
                    <span style={r.chip}>{tx(r.state)}</span>
                    <span style={S('display:flex;align-items:center;gap:8px')}>
                      <span style={r.sw}></span>
                      {tx(r.colorText)}
                    </span>
                    <span style={S('text-align:right;font-variant-numeric:tabular-nums')}>{tx(r.pctText)}</span>
                    <span style={S('text-align:right;font-variant-numeric:tabular-nums;font-weight:600')}>{tx(r.avg)}</span>
                    <span style={r.minS}>{tx(r.min)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
          {v.hasWF ? (
            <>
              <div style={S('display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px')}>
                {wf.stats.map((t: any, i: number) => (
                  <div key={i} style={S('display:flex;flex-direction:column;gap:2px;min-width:0')}>
                    <span style={S('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-700)')}>{tx(t.k)}</span>
                    <span style={S('font-family:var(--font-heading);font-size:34px;font-weight:600;line-height:1;font-variant-numeric:tabular-nums;white-space:nowrap')}>
                      {tx(t.v)}
                      <span style={S('font-size:15px;color:var(--color-neutral-700)')}>{' ' + tx(t.u)}</span>
                    </span>
                    <span style={t.sS}>{tx(t.s)}</span>
                  </div>
                ))}
              </div>
              <div style={S('display:flex;flex-direction:column;gap:6px')}>
                <div style={S('display:flex;justify-content:space-between;align-items:baseline')}>
                  <span style={S('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-700)')}>Water / feed ratio</span>
                  <span style={S('font-size:11px;color:var(--color-neutral-700)')}>Target {tx(wf.rBandT)}</span>
                </div>
                <div style={S('position:relative;height:30px')}>
                  <div style={S('position:absolute;left:0;right:0;top:12px;height:10px;background:var(--color-neutral-200)')}></div>
                  <div style={wf.rBand}></div>
                  <div style={wf.rMark}></div>
                  <span style={wf.rLab}>{tx(wf.ratio)}</span>
                </div>
                <div style={S('display:flex;justify-content:space-between;font-size:10px;color:var(--color-neutral-700)')}>
                  <span>{tx(wf.rMin)} · birds eating more than drinking</span>
                  <span>drinking more than eating · {tx(wf.rMax)}</span>
                </div>
              </div>
              <div style={S('display:flex;flex-direction:column;gap:6px')}>
                <div style={S('display:flex;justify-content:space-between;align-items:baseline')}>
                  <span style={S('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-700)')}>Hourly intake · today</span>
                  <span style={S('font-size:11px;color:var(--color-neutral-700);display:flex;gap:12px')}>
                    <span style={S('display:flex;align-items:center;gap:5px')}>
                      <span style={S('width:10px;height:10px;background:var(--color-accent-300)')}></span>Water (L)
                    </span>
                    <span style={S('display:flex;align-items:center;gap:5px')}>
                      <span style={S('width:10px;height:10px;background:var(--color-accent-900)')}></span>Feed (kg)
                    </span>
                    <span style={S('display:flex;align-items:center;gap:5px')}>
                      <span style={S('width:10px;height:10px;background:var(--color-neutral-200)')}></span>Lights off
                    </span>
                  </span>
                </div>
                <div style={S('display:flex;align-items:flex-end;gap:3px;height:120px;border-bottom:1px solid var(--color-neutral-400)')}>
                  {wf.hours.map((b: any, i: number) => (
                    <div key={i} style={b.col}>
                      <div style={b.w}></div>
                      <div style={b.f}></div>
                    </div>
                  ))}
                </div>
                <div style={S('display:flex;justify-content:space-between;font-size:10px;color:var(--color-neutral-700)')}>
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>23:00</span>
                </div>
              </div>
              <div style={S('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px')}>
                <div className="blueprint" style={S('padding:14px;display:flex;flex-direction:column;gap:10px')}>
                  <Corners />
                  <span style={S('font-family:var(--font-heading);font-size:18px;font-weight:600')}>Water system</span>
                  {wf.meters.map((m: any, i: number) => (
                    <div key={i} style={S('display:flex;justify-content:space-between;font-size:13px;border-bottom:1px solid var(--color-divider);padding-bottom:6px')}>
                      <span style={S('color:var(--color-neutral-700)')}>{tx(m.k)}</span>
                      <span style={S('font-variant-numeric:tabular-nums;font-weight:600')}>{tx(m.v)} L</span>
                    </div>
                  ))}
                  <div style={S('display:flex;flex-direction:column;gap:4px')}>
                    <div style={S('display:flex;justify-content:space-between;font-size:12px')}>
                      <span style={S('color:var(--color-neutral-700)')}>Drinker line pressure</span>
                      <b>{tx(wf.p)} cm</b>
                    </div>
                    <div style={S('position:relative;height:8px;background:var(--color-neutral-200)')}>
                      <div style={wf.pBand}></div>
                      <div style={wf.pMark}></div>
                    </div>
                  </div>
                  <div style={S('display:flex;justify-content:space-between;font-size:12px')}>
                    <span style={S('color:var(--color-neutral-700)')}>Emergency pressure</span>
                    <span>{tx(wf.emergency)}</span>
                  </div>
                  <div style={S('display:flex;justify-content:space-between;font-size:12px')}>
                    <span style={S('color:var(--color-neutral-700)')}>Use alarms</span>
                    <span>{tx(wf.wAl)}</span>
                  </div>
                </div>
                <div className="blueprint" style={S('padding:14px;display:flex;flex-direction:column;gap:10px')}>
                  <Corners />
                  <span style={S('font-family:var(--font-heading);font-size:18px;font-weight:600')}>Feed system</span>
                  {wf.lines.map((m: any, i: number) => (
                    <div
                      key={i}
                      style={S('display:flex;align-items:center;gap:8px;font-size:13px;border-bottom:1px solid var(--color-divider);padding-bottom:6px')}
                    >
                      <span style={S('color:var(--color-neutral-700);flex:1')}>{tx(m.k)}</span>
                      <span style={S('font-variant-numeric:tabular-nums;font-weight:600')}>{tx(m.v)} kg</span>
                      <span style={m.chip}>{tx(m.st)}</span>
                    </div>
                  ))}
                  <div style={S('display:flex;justify-content:space-between;font-size:12px')}>
                    <span style={S('color:var(--color-neutral-700)')}>Pan sensor</span>
                    <span>{tx(wf.pan)}</span>
                  </div>
                  <div style={S('display:flex;justify-content:space-between;font-size:12px')}>
                    <span style={S('color:var(--color-neutral-700)')}>Program</span>
                    <span>{tx(wf.program)}</span>
                  </div>
                  <div style={S('display:flex;justify-content:space-between;font-size:12px')}>
                    <span style={S('color:var(--color-neutral-700)')}>Intake alarms</span>
                    <span>{tx(wf.fAl)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
          {v.hasTMap ? (
            <>
              <div style={S('display:flex;gap:32px;flex-wrap:wrap')}>
                {tm.stats.map((t: any, i: number) => (
                  <div key={i} style={S('display:flex;flex-direction:column;gap:2px')}>
                    <span style={S('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-700)')}>{tx(t.k)}</span>
                    <span style={S('font-family:var(--font-heading);font-size:36px;font-weight:600;line-height:1;font-variant-numeric:tabular-nums')}>
                      {tx(t.v)}
                      <span style={S('font-size:16px;color:var(--color-neutral-700)')}>{' ' + tx(t.u)}</span>
                    </span>
                    <span style={S('font-size:12px;color:var(--color-neutral-700)')}>{tx(t.s)}</span>
                  </div>
                ))}
              </div>
              <div style={S('display:flex;flex-direction:column;gap:8px')}>
                <div style={S('display:flex;justify-content:space-between;align-items:baseline')}>
                  <span style={S('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-700)')}>Sensor map · top view</span>
                  <span style={S('font-size:11px;color:var(--color-neutral-700)')}>Live · updated 12:04</span>
                </div>
                <div style={S('display:flex;gap:10px;align-items:stretch')}>
                  <div
                    style={S(
                      'writing-mode:vertical-rl;transform:rotate(180deg);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-700);text-align:center',
                    )}
                  >
                    Entrance
                  </div>
                  <div style={tm.house}>
                    {tm.inlets.map((n: any, i: number) => (
                      <div key={i} style={n.style}></div>
                    ))}
                    {tm.heaters.map((x: any, i: number) => (
                      <div key={i} style={x.pos}>
                        <div style={x.dot}>{tx(x.k)}</div>
                        <span style={x.lab}>{tx(x.st)}</span>
                      </div>
                    ))}
                    {tm.sensors.map((x: any, i: number) => (
                      <div key={i} style={x.pos}>
                        <div style={x.ring}></div>
                        <div style={x.card}>
                          <span style={S('font-size:10px;font-weight:700;color:var(--color-neutral-700)')}>{tx(x.k)}</span>
                          <span style={x.vS}>{tx(x.v)}°</span>
                          <span style={x.dS}>{tx(x.d)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={S('writing-mode:vertical-rl;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-700);text-align:center')}>
                    Tunnel end
                  </div>
                </div>
                <div style={S('display:flex;align-items:center;gap:16px;font-size:11px;color:var(--color-neutral-700);flex-wrap:wrap')}>
                  <span style={S('display:flex;align-items:center;gap:6px')}>
                    <span style={S('width:80px;height:8px;background:linear-gradient(90deg,#8fcdf8,#c9e8ff 45%,#f2a38f 75%,#e0473a)')}></span>On target → above target
                  </span>
                  <span>◯ Sensor</span>
                  <span>● Heater (orange = firing)</span>
                  <span>▬ Inlet</span>
                </div>
              </div>
              <div style={S('display:flex;flex-direction:column')}>
                <div
                  style={S(
                    'display:grid;grid-template-columns:50px minmax(0,1fr) 80px 80px 70px;gap:12px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--color-neutral-700);padding:0 0 6px;border-bottom:1px solid var(--color-divider)',
                  )}
                >
                  <span>Sensor</span>
                  <span>Location</span>
                  <span style={S('text-align:right')}>Reading</span>
                  <span style={S('text-align:right')}>vs avg</span>
                  <span>Status</span>
                </div>
                {tm.sensors.map((x: any, i: number) => (
                  <div key={i} style={x.row}>
                    <b>{tx(x.k)}</b>
                    <span style={S('color:var(--color-neutral-700)')}>{tx(x.loc)}</span>
                    <span style={S('text-align:right;font-variant-numeric:tabular-nums')}>{tx(x.v)} °C</span>
                    <span style={x.dS2}>{tx(x.d)}</span>
                    <span style={x.chip}>{tx(x.st)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
          {v.hasMap ? (
            <div style={S('display:flex;flex-direction:column;gap:12px')}>
              <div style={S('display:flex;align-items:flex-end;gap:32px;flex-wrap:wrap')}>
                <div style={S('display:flex;flex-direction:column;gap:2px')}>
                  <span style={S('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-700)')}>Power level</span>
                  <span style={S(`font-family:var(--font-heading);font-size:${tx(v.statFs)}px;font-weight:600;line-height:1`)}>{tx(map.level)}</span>
                  <span style={S(`font-size:12px;color:var(--color-neutral-700);display:${tx(v.statSubD)}`)}>{tx(map.mode)}</span>
                </div>
                <div style={S('display:flex;flex-direction:column;gap:2px')}>
                  <span style={S('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-700)')}>Output</span>
                  <span style={S(`font-family:var(--font-heading);font-size:${tx(v.statFs)}px;font-weight:600;line-height:1`)}>
                    {tx(map.output)}
                    <span style={S('font-size:18px;color:var(--color-neutral-700)')}>%</span>
                  </span>
                  <span style={S(`font-size:12px;color:var(--color-neutral-700);display:${tx(v.statSubD)}`)}>of max ventilation</span>
                </div>
                <div style={S('display:flex;flex-direction:column;gap:2px')}>
                  <span style={S('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-700)')}>Running</span>
                  <span style={S(`font-family:var(--font-heading);font-size:${tx(v.statFs)}px;font-weight:600;line-height:1`)}>
                    {tx(map.running)}
                    <span style={S('font-size:18px;color:var(--color-neutral-700)')}> / {tx(map.total)}</span>
                  </span>
                  <span style={S(`font-size:12px;color:var(--color-neutral-700);display:${tx(v.statSubD)}`)}>fans on</span>
                </div>
              </div>
              <div style={S('display:flex;flex-direction:column;gap:6px;width:100%')}>
                <div style={S(`position:relative;display:flex;gap:4px;height:${tx(v.gH)}px;margin-top:6px`)}>
                  <div style={map.gRange}></div>
                  {map.gSegs.map((sg: any, i: number) => (
                    <div key={i} style={sg}></div>
                  ))}
                </div>
                <div style={S('position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px')}>
                  <div style={map.gHandle}>
                    <div style={S('width:1px;height:10px;background:var(--color-neutral-500)')}></div>
                  </div>
                  {map.gGroups.map((g: any, i: number) => (
                    <div key={i} style={g.style}>
                      <div style={S('display:flex;gap:4px')}>
                        {g.levels.map((lv: any, j: number) => (
                          <span key={j} style={lv.s}>
                            {tx(lv.k)}
                          </span>
                        ))}
                      </div>
                      <span style={g.nameS}>{tx(g.t)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          {v.hasSilos ? (
            <>
              {v.ordered ? (
                <div style={S('display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--color-accent-100);border:1px solid var(--color-accent-300)')}>
                  <span style={S('font-size:18px;color:var(--color-accent-800)')}>✓</span>
                  <div style={S('display:flex;flex-direction:column;gap:2px;min-width:0')}>
                    <span style={S('font-size:14px;font-weight:600')}>Delivery requested · {tx(v.d.order?.date)}</span>
                    <span style={S('font-size:12px;color:var(--color-neutral-700)')}>
                      {tx(v.orderSummary)} · {tx(v.d.order?.supplier)} will confirm by SMS
                    </span>
                  </div>
                </div>
              ) : null}
              <div style={v.siloGrid}>
                {v.silos.map((s: any, i: number) => (
                  <div key={i} style={s.card}>
                    <div style={S('display:flex;gap:14px;align-items:stretch')}>
                      <div style={S('display:flex;flex-direction:column;align-items:center;gap:0;flex:none')}>
                        <div style={S('width:44px;height:10px;border:1.5px solid var(--color-text);border-bottom:none;border-radius:22px 22px 0 0')}></div>
                        <div style={s.body}>
                          <div style={s.fill}></div>
                        </div>
                        <div
                          style={S('width:0;height:0;border-left:22px solid transparent;border-right:22px solid transparent;border-top:14px solid var(--color-text)')}
                        ></div>
                      </div>
                      <div style={S('display:flex;flex-direction:column;gap:6px;min-width:0;flex:1')}>
                        <div style={S('display:flex;align-items:center;justify-content:space-between;gap:6px')}>
                          <span style={S('font-weight:600;font-size:14px')}>{tx(s.n)}</span>
                          <span style={S('font-size:10px;letter-spacing:.04em;text-transform:uppercase;padding:1px 6px;border:1px solid var(--color-neutral-500)')}>
                            {tx(s.type)}
                          </span>
                        </div>
                        <div style={S('display:flex;align-items:baseline;gap:4px')}>
                          <span style={S('font-family:var(--font-heading);font-size:30px;font-weight:600;line-height:1;font-variant-numeric:tabular-nums')}>{tx(s.tons)}</span>
                          <span style={S('font-size:12px;color:var(--color-neutral-700)')}>{tx(s.capText)}</span>
                        </div>
                        <span style={s.daysStyle}>{tx(s.daysText)}</span>
                      </div>
                    </div>
                    <div style={S('display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:12px;border-top:1px solid var(--color-divider);padding-top:8px')}>
                      <span style={S('color:var(--color-neutral-700)')}>Runs out</span>
                      <span style={S('text-align:right')}>{tx(s.out)}</span>
                      <span style={S('color:var(--color-neutral-700)')}>Daily use</span>
                      <span style={S('text-align:right')}>{tx(s.use)}</span>
                      <span style={S('color:var(--color-neutral-700)')}>Last fill</span>
                      <span style={S('text-align:right')}>{tx(s.last)}</span>
                      <span style={S('color:var(--color-neutral-700)')}>Feed temp</span>
                      <span style={S('text-align:right')}>{tx(s.temp)}</span>
                    </div>
                    {s.hasErr ? <span style={S('font-size:12px;color:#8c1d18')}>{tx(s.err)}</span> : null}
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
        <div style={S(`display:flex;flex-direction:column;gap:${tx(v.colGap)}px;min-width:0;grid-row:${tx(v.insRow)}`)}>
          {this.renderInsights(v)}
          {v.showSubs ? (
            <div style={S('display:flex;flex-direction:column;gap:6px')}>
              <span style={S('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-700)')}>Sub-fields &amp; alerts</span>
              {v.subs.map((s: any, i: number) => (
                <div key={i} style={s.box}>
                  <div style={S('display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:12px;align-items:center;font-size:13px')}>
                    <span>{tx(s.k)}</span>
                    <span style={S('font-variant-numeric:tabular-nums')}>{tx(s.v)}</span>
                    <span className={s.tagClass} style={s.tagStyle}>
                      {tx(s.tag)}
                    </span>
                  </div>
                  {s.hasNote ? <span style={s.noteStyle}>{tx(s.note)}</span> : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
        {v.hasMap ? (
          <div style={S(`grid-column:${tx(v.mapCol)};display:flex;flex-direction:column;gap:8px;min-width:0`)}>
            <div style={S('display:flex;justify-content:space-between;align-items:baseline')}>
              <span style={S('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-700)')}>Fan map</span>
              <span style={S('font-size:11px;color:var(--color-neutral-700);display:flex;gap:12px')}>
                <span>● Running</span>
                <span style={S('color:var(--color-neutral-500)')}>○ Stopped</span>
              </span>
            </div>
            <div style={S('display:flex;gap:16px;align-items:center;flex-wrap:wrap')}>
              <div
                style={S(
                  `display:flex;flex-direction:${tx(v.invDir)};flex-wrap:wrap;gap:8px 12px;flex:${tx(v.invFlex)};min-width:0;align-self:${tx(v.invAlign)}`,
                )}
              >
                {map.groups.map((g: any, i: number) => (
                  <div key={i} style={g.wrap}>
                    <span style={S('font-size:11px;font-weight:600')}>
                      {tx(g.t)}{' '}
                      <span style={S('font-weight:400;color:var(--color-neutral-700)')}>
                        · {tx(g.on)} of {tx(g.n)} on
                      </span>
                    </span>
                    <div style={g.grid}>
                      {g.f.map((x: any, j: number) => (
                        <div key={j} style={x.tile}>
                          <span style={S('font-size:10px;font-weight:600;white-space:nowrap')}>{tx(x.k)}</span>
                          <svg viewBox="0 0 24 24" style={x.svg} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <g style={x.spin}>
                              <path d={FAN_PATH}></path>
                              <circle cx="12" cy="12" r="1"></circle>
                            </g>
                          </svg>
                          <span style={x.chip}>{tx(x.st)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={S(
                  `position:relative;flex:1 1 0;min-width:${tx(v.schemeMin)};max-width:${tx(v.schemeMax)};order:-1;container-type:inline-size`,
                )}
              >
                <svg viewBox="26 0 594 230" style={S('width:100%;height:auto;display:block;overflow:visible')}>
                  <rect x="50" y="45" width="520" height="140" fill="none" stroke="var(--color-neutral-600)" strokeWidth="1.5"></rect>
                  <line x1="50" y1="115" x2="570" y2="115" stroke="var(--color-neutral-300)" strokeDasharray="4 5"></line>
                  <text
                    x="0"
                    y="0"
                    transform="translate(38 115) rotate(-90)"
                    textAnchor="middle"
                    fontSize="11"
                    letterSpacing="1.2"
                    fill="var(--color-neutral-700)"
                    style={S('text-transform:uppercase')}
                  >
                    Front
                  </text>
                  <text
                    x="0"
                    y="0"
                    transform="translate(614 115) rotate(90)"
                    textAnchor="middle"
                    fontSize="11"
                    letterSpacing="1.2"
                    fill="var(--color-neutral-700)"
                    style={S('text-transform:uppercase')}
                  >
                    Back
                  </text>
                  {map.scheme.map((x: any, i: number) => (
                    <g key={i}>
                      <path
                        d={x.arrow}
                        fill="none"
                        stroke="var(--color-accent-500)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={x.arrS}
                      ></path>
                      <svg x={x.x} y={x.y} width={x.s} height={x.s} viewBox="0 0 24 24" overflow="visible" style={x.col}>
                        <circle cx="12" cy="12" r="11.5" fill="var(--color-bg)" stroke="currentColor" strokeWidth="1.4"></circle>
                        <g style={x.spin}>
                          <path
                            d={FAN_PATH}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinejoin="round"
                            transform="translate(12 12) scale(.78) translate(-12 -12)"
                          ></path>
                        </g>
                      </svg>
                    </g>
                  ))}
                </svg>
                {map.scheme.map((x: any, i: number) => (
                  <span key={i} style={x.labS}>
                    {tx(x.k)}
                  </span>
                ))}
                {map.inl.map((n: any, i: number) => (
                  <div key={i} style={n.box}>
                    <span style={S('font-size:1em;font-weight:600;color:var(--color-accent-900)')}>{tx(n.k)}</span>
                    <svg
                      viewBox="0 0 16 24"
                      width="1.1em"
                      height="1.6em"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={n.ic}
                    >
                      <path d="M5 3H2v18h3"></path>
                      <path d="M6 12h8M11 9l3 3-3 3" style={n.air}></path>
                    </svg>
                    <span style={n.vS}>{tx(n.v)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  render() {
    const v = this.renderVals();
    const { w, d } = v;
    return (
      <div style={{ width: '100%', height: '100%', ...this.props.style }}>
        <div ref={v.rootRef} style={v.rootStyle}>
          <div style={S('display:flex;align-items:center;gap:10px;padding:16px 24px;border-bottom:1px solid var(--color-divider)')}>
            {v.inSub ? (
              <button className="btn btn-ghost" onClick={v.back}>
                ← Back
              </button>
            ) : null}
            <div style={S('display:flex;flex-direction:column;margin-right:auto;min-width:0')}>
              <span style={S('font-size:11px;color:var(--color-neutral-700)')}>{tx(v.crumbText)}</span>
              <div style={S('display:flex;align-items:center;gap:10px')}>
                <span style={S('font-family:var(--font-heading);font-size:26px;font-weight:600;line-height:1.1')}>{tx(v.titleText)}</span>
                <span className={v.tagClass} style={v.tagStyle}>
                  {tx(w.statusText)}
                </span>
              </div>
            </div>
            <button className="btn btn-secondary btn-icon" onClick={v.onClose}>
              ✕
            </button>
          </div>
          {v.inDetail ? (
            <>
              {v.tabOverview ? this.renderOverview(v) : null}
              {v.tabHistory ? (
                <div style={v.detailStyle}>
                  <div style={S('display:flex;flex-direction:column;gap:24px;min-width:0')}>{this.renderChart(v)}</div>
                  <div style={S('display:flex;flex-direction:column;gap:24px;min-width:0')}>{this.renderInsights(v)}</div>
                </div>
              ) : null}
              {v.tabMarket ? (
                <div style={v.detailStyle}>
                  <div style={S('display:flex;flex-direction:column;gap:24px;min-width:0')}>
                    <div style={S('display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px')}>
                      {v.market.map((k: any, i: number) => (
                        <div key={i} className="blueprint" style={S('padding:12px;display:flex;flex-direction:column;gap:2px;min-width:0')}>
                          <Corners />
                          <span style={S('font-size:11px;color:var(--color-neutral-700)')}>{tx(k.k)}</span>
                          <span style={S('font-family:var(--font-heading);font-size:26px;font-weight:600;line-height:1.1')}>{tx(k.v)}</span>
                          <span style={S('font-size:11px;color:var(--color-neutral-700)')}>{tx(k.s)}</span>
                        </div>
                      ))}
                    </div>
                    {this.renderChart(v)}
                  </div>
                  <div style={S('display:flex;flex-direction:column;gap:24px;min-width:0')}>{this.renderInsights(v)}</div>
                </div>
              ) : null}
              <div style={S('padding:14px 24px;border-top:1px solid var(--color-divider);display:flex;align-items:center;gap:12px')}>
                {v.lowFeed ? (
                  <div style={S('display:flex;align-items:center;gap:8px;margin-right:auto;min-width:0')}>
                    <span style={S('width:8px;height:8px;border-radius:50%;background:#b3261e;flex:none')}></span>
                    <span style={S('font-size:13px;font-weight:600;color:#8c1d18')}>{tx(v.lowTitle)}</span>
                    <span style={S('font-size:12px;color:var(--color-neutral-700);white-space:nowrap')}>
                      · suggested {tx(d.order?.grower)} t grower, {tx(d.order?.starter)} t starter
                    </span>
                  </div>
                ) : null}
                {v.noLow ? <span style={S('font-size:12px;color:var(--color-neutral-700);margin-right:auto')}>{tx(d.path)}</span> : null}
                {v.hasSilos ? (
                  <button className="btn btn-primary" onClick={v.toOrder} style={S('white-space:nowrap')}>
                    Order feed delivery
                  </button>
                ) : null}
                {v.ventHead ? (
                  <>
                    <button className="btn btn-secondary" onClick={v.toProgram}>
                      Ventilation program
                    </button>
                    <button className="btn btn-secondary" onClick={v.toMinMax}>
                      Min / Max ventilation
                    </button>
                    <button className="btn btn-secondary" onClick={v.toSettings}>
                      Ventilation settings
                    </button>
                  </>
                ) : null}
                {v.notVent ? (
                  <button className={v.cfgClass} onClick={v.toSettings}>
                    <Corners />
                    Configure {tx(w.title)} →
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
          {v.inOrder ? (
            <>
              <div style={S('flex:1;overflow:auto;padding:20px 24px;display:flex;flex-direction:column;gap:22px')}>
                <div style={S('display:flex;flex-direction:column;gap:10px')}>
                  <span style={S('font-family:var(--font-heading);font-size:18px;font-weight:600;border-bottom:1px solid var(--color-divider);padding-bottom:4px')}>Feed</span>
                  {(v.orderLines || []).map((o: any, i: number) => (
                    <div
                      key={i}
                      style={S('display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--color-divider)')}
                    >
                      <div style={S('display:flex;flex-direction:column;gap:2px')}>
                        <span style={S('font-weight:600;font-size:14px')}>{tx(o.type)}</span>
                        <span style={S('font-size:12px;color:var(--color-neutral-700)')}>
                          Into {tx(o.into)} · room for {tx(o.room)} t
                        </span>
                      </div>
                      <div style={S('display:flex;align-items:center;gap:6px')}>
                        <button className="btn btn-secondary btn-icon" onClick={o.dec}>
                          −
                        </button>
                        <span style={S('font-family:var(--font-heading);font-size:22px;font-weight:600;min-width:56px;text-align:center;font-variant-numeric:tabular-nums')}>
                          {tx(o.t)} t
                        </span>
                        <button className="btn btn-secondary btn-icon" onClick={o.inc}>
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                  <span style={S('font-size:12px;color:var(--color-neutral-700)')}>Suggested amounts cover 14 days at current use.</span>
                </div>
                <div style={S('display:flex;flex-direction:column;gap:10px')}>
                  <span style={S('font-family:var(--font-heading);font-size:18px;font-weight:600;border-bottom:1px solid var(--color-divider);padding-bottom:4px')}>Delivery</span>
                  <div style={S('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 16px')}>
                    <div className="field">
                      <label>Supplier</label>
                      <input className="input" defaultValue={tx(d.order?.supplier)} />
                    </div>
                    <div className="field">
                      <label>Requested date</label>
                      <input className="input" defaultValue={tx(d.order?.date)} />
                    </div>
                    <div className="field" style={S('grid-column:1 / -1')}>
                      <label>Note to driver</label>
                      <input className="input" defaultValue="Gate code 4412 · fill silo 3 first" />
                    </div>
                  </div>
                </div>
              </div>
              <div style={S('padding:14px 24px;border-top:1px solid var(--color-divider);display:flex;gap:8px;align-items:center')}>
                <span style={S('font-size:13px;margin-right:auto')}>
                  Total <b>{tx(v.orderTotal)} t</b>
                </span>
                <button className="btn btn-secondary" onClick={v.back}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={v.placeOrder}>
                  Send request
                </button>
              </div>
            </>
          ) : null}
          {v.inMinMax ? (
            <div style={S('flex:1;overflow:auto;padding:16px 24px 24px;display:flex;flex-direction:column;gap:14px')}>
              <div style={S('border:1px solid var(--color-divider);display:flex;flex-direction:column')}>
                <div
                  style={S(
                    'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));background:var(--color-neutral-200);border-bottom:1px solid var(--color-neutral-400);font-family:var(--font-heading);font-size:16px;font-weight:600;text-align:center',
                  )}
                >
                  <div style={S('padding:10px 4px;border-right:1px solid var(--color-neutral-300)')}>Day</div>
                  <div style={S('padding:10px 4px;border-right:1px solid var(--color-neutral-300)')}>Minimum</div>
                  <div style={S('padding:10px 4px')}>Maximum</div>
                </div>
                {v.minmax.map((r: any, i: number) => (
                  <div key={i} style={r.row}>
                    <div style={S('padding:12px 4px;background:var(--color-neutral-100);border-right:1px solid var(--color-divider);font-weight:600')}>{tx(r.day)}</div>
                    <div style={S('padding:12px 4px;border-right:1px solid var(--color-divider)')}>{tx(r.min)}</div>
                    <div style={S('padding:12px 4px')}>{tx(r.max)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {v.inProgram ? (
            <div style={S('flex:1;overflow:auto;padding:16px 24px 24px;display:flex;flex-direction:column;gap:14px')}>
              <div style={S('display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap')}>
                <div className="seg">
                  {v.prog.tabs.map((t: any, i: number) => (
                    <label key={i} className="seg-opt" onClick={t.pick} style={t.style}>
                      {tx(t.label)}
                    </label>
                  ))}
                </div>
                <div style={S('display:flex;gap:14px;font-size:11px;color:var(--color-neutral-700)')}>
                  <span style={S('display:flex;align-items:center;gap:6px')}>
                    <span style={S('width:12px;height:12px;border-radius:50%;background:var(--color-accent-900)')}></span>Continuous
                  </span>
                  <span style={S('display:flex;align-items:center;gap:6px')}>
                    <span style={S('width:12px;height:12px;border-radius:50%;border:1.5px solid var(--color-accent-900)')}></span>Cycling
                  </span>
                </div>
              </div>
              <div style={S('overflow-x:auto;border:1px solid var(--color-divider)')}>
                <div style={S('min-width:720px;display:flex;flex-direction:column')}>
                  <div
                    style={S(
                      'display:grid;grid-template-columns:84px 64px repeat(10,minmax(52px,1fr));background:var(--color-neutral-200);border-bottom:1px solid var(--color-neutral-400)',
                    )}
                  >
                    <div
                      style={S(
                        'grid-row:span 2;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 4px;border-right:1px solid var(--color-neutral-300)',
                      )}
                    >
                      <span style={S('font-family:var(--font-heading);font-size:16px;font-weight:600')}>Level</span>
                      <span style={S('font-size:10px;color:var(--color-neutral-700)')}>m³/h</span>
                    </div>
                    <div
                      style={S(
                        'grid-row:span 2;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 4px;border-right:1px solid var(--color-neutral-300)',
                      )}
                    >
                      <span style={S('font-family:var(--font-heading);font-size:16px;font-weight:600')}>On</span>
                      <span style={S('font-size:10px;color:var(--color-neutral-700)')}>sec</span>
                    </div>
                    <div
                      style={S(
                        'grid-column:span 10;text-align:center;padding:8px 0;font-family:var(--font-heading);font-size:16px;font-weight:600;border-bottom:1px solid var(--color-neutral-300)',
                      )}
                    >
                      Fans
                    </div>
                    {v.prog.fanCols.map((f: any, i: number) => (
                      <div key={i} style={S('text-align:center;padding:6px 0;font-size:13px;font-weight:600;border-right:1px solid var(--color-neutral-300)')}>
                        {tx(f.k)}
                      </div>
                    ))}
                  </div>
                  {v.prog.rows.map((r: any, i: number) => (
                    <div key={i} style={r.row}>
                      <div
                        style={S(
                          'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 4px;background:var(--color-neutral-100);border-right:1px solid var(--color-divider)',
                        )}
                      >
                        <span style={S('font-family:var(--font-heading);font-size:20px;font-weight:600;line-height:1')}>{tx(r.k)}</span>
                        <span style={S('font-size:10px;color:var(--color-neutral-700);font-variant-numeric:tabular-nums')}>{tx(r.m3)}</span>
                      </div>
                      <div style={S('display:grid;place-items:center;font-size:15px;font-variant-numeric:tabular-nums;border-right:1px solid var(--color-divider)')}>
                        {tx(r.on)}
                      </div>
                      {r.cells.map((c: any, j: number) => (
                        <div
                          key={j}
                          style={S(
                            'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:8px 0;border-right:1px solid var(--color-divider)',
                          )}
                        >
                          {c.has ? (
                            <>
                              <span style={c.ring}>
                                <svg
                                  viewBox="0 0 24 24"
                                  width="18"
                                  height="18"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d={FAN_PATH}></path>
                                  <circle cx="12" cy="12" r="1"></circle>
                                </svg>
                              </span>
                              <span style={S('font-size:11px;color:var(--color-neutral-700);font-variant-numeric:tabular-nums')}>{tx(c.pct)}</span>
                            </>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          {v.inSettings ? (
            <>
              <div style={S('flex:1;overflow:auto;padding:20px 24px;display:flex;flex-direction:column;gap:22px')}>
                {v.groups.map((g: any, i: number) => (
                  <div key={i} style={S('display:flex;flex-direction:column;gap:10px')}>
                    <span style={S('font-family:var(--font-heading);font-size:18px;font-weight:600;border-bottom:1px solid var(--color-divider);padding-bottom:4px')}>
                      {tx(g.t)}
                    </span>
                    <div style={S('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 16px')}>
                      {g.f.map((f: any, j: number) => (
                        <div key={j} className="field">
                          <label>{tx(f.k)}</label>
                          <input className="input" defaultValue={tx(f.v)} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={S('padding:14px 24px;border-top:1px solid var(--color-divider);display:flex;gap:8px;justify-content:flex-end')}>
                <button className="btn btn-secondary" onClick={v.back}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={v.back}>
                  Save
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    );
  }
}

export default WidgetDrawer;
