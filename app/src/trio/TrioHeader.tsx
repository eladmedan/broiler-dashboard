import type { ReactNode } from 'react';
import './TrioHeader.css';

/* ------------------------------------------------------------------ */
/* Inline outline icons (thin stroke, currentColor)                     */
/* ------------------------------------------------------------------ */

type IconProps = { size?: number; children: ReactNode; strokeWidth?: number };

function Icon({ size = 24, strokeWidth = 1.5, children }: IconProps) {
  return (
    <svg
      className="trio-hdr-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const ChevronDownIcon = () => (
  <Icon>
    <path d="M6 9.5l6 6 6-6" />
  </Icon>
);
const BarnIcon = () => (
  <Icon>
    <path d="M5 20V9.5C5 6.5 8 4 12 4s7 2.5 7 5.5V20H5z" />
    <circle cx="12" cy="9.5" r="1.4" />
    <path d="M9 20v-6h6v6M9 14l6 6M15 14l-6 6" />
  </Icon>
);
const HomeIcon = () => (
  <Icon strokeWidth={1.3}>
    <path d="M4.5 10.2L12 4l7.5 6.2V20h-15v-9.8z" />
  </Icon>
);
const CloseIcon = () => (
  <Icon size={20}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </Icon>
);
const PlusIcon = () => (
  <Icon strokeWidth={1.8}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
const HelpIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.6a2.4 2.4 0 1 1 3.4 2.2c-.6.3-1 .8-1 1.5v.6" />
    <circle cx="12" cy="16.8" r=".4" fill="currentColor" />
  </Icon>
);
const BackIcon = () => (
  <Icon>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);
const MenuIcon = () => (
  <Icon>
    <path d="M5 7.5h14M5 12h14M5 16.5h14" />
  </Icon>
);
const GlobeIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="7.5" />
    <path d="M4.5 12h15M12 4.5c-2.2 2.2-2.2 12.8 0 15M12 4.5c2.2 2.2 2.2 12.8 0 15" />
  </Icon>
);
const WifiIcon = () => (
  <Icon>
    <path d="M4.5 10a11 11 0 0 1 15 0M7.3 13a7 7 0 0 1 9.4 0" />
    <circle cx="12" cy="16.5" r="1.1" fill="currentColor" stroke="none" />
  </Icon>
);
const BellIcon = () => (
  <Icon>
    <path d="M7 16.5V11a5 5 0 0 1 10 0v5.5l1.5 1.5h-13L7 16.5z" />
    <path d="M12 4.5V6M10.5 20a1.6 1.6 0 0 0 3 0" />
  </Icon>
);
const ControllerIcon = () => (
  <Icon>
    <rect x="5.5" y="4" width="13" height="16" rx=".5" />
    <rect x="9" y="6.5" width="6" height="2.5" />
  </Icon>
);
const CloudSunIcon = () => (
  <Icon strokeWidth={1.3}>
    <path d="M6.5 18h9a3 3 0 0 0 .3-6 4.2 4.2 0 0 0-8-1A3.5 3.5 0 0 0 6.5 18z" />
    <path d="M15.6 9.6a2.8 2.8 0 1 1 3.4 3.3M18 4.5v1M21.5 8.5h-1M20.5 5.5l-.7.7" />
  </Icon>
);
const ThermoSunIcon = () => (
  <Icon strokeWidth={1.3}>
    <path d="M7 14.2V5.5a2 2 0 0 1 4 0v8.7a3.3 3.3 0 1 1-4 0z" />
    <path d="M9 11v5" />
    <circle cx="16.5" cy="9" r="2" />
    <path d="M16.5 4.5v1M16.5 12.5v1M20.5 9h1M13.5 6l.6.6M19.5 6l-.6.6M19.5 12l-.6-.6" />
  </Icon>
);
const DropletIcon = () => (
  <Icon strokeWidth={1.3}>
    <path d="M10 5c-2.5 3.5-4.5 6.2-4.5 9a4.5 4.5 0 0 0 9 0c0-2.8-2-5.5-4.5-9z" />
    <path d="M15.5 4.5h4M16.5 6.8h3M17.5 9.1h2" />
  </Icon>
);
const SunIcon = () => (
  <Icon strokeWidth={1.3}>
    <circle cx="12" cy="12" r="3.3" />
    <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M6 18l1.4-1.4M16.6 7.4L18 6" />
  </Icon>
);
const WindIcon = () => (
  <Icon strokeWidth={1.3}>
    <path d="M4 9h10.5a2.3 2.3 0 1 0-2.2-3M4 12.5h15.5M4 16h9.5a2.3 2.3 0 1 1-2.2 3" />
  </Icon>
);
const RelayIcon = () => (
  <Icon strokeWidth={1.4}>
    <rect x="7.5" y="6.5" width="9" height="14" rx="1.5" />
    <path d="M10 6.5V3.5h4v3" />
  </Icon>
);

/* ------------------------------------------------------------------ */
/* 1. App bar (7854:2056 + tabs 7854:2982 / 7854:2789)                  */
/* ------------------------------------------------------------------ */

type Tab = { id: string; label: string };
const TABS: Tab[] = [
  { id: 'h1', label: 'House 01' },
  { id: 'h2', label: 'House 02' },
];

export function TrioAppBar() {
  const activeId = 'h1';
  return (
    <header className="trio-appbar">
      <div className="trio-appbar__left">
        <div className="trio-appbar__brand">
          <img className="trio-appbar__logo" src="assets/trio/trioair-logo.png" alt="TrioAir" />
          <span className="trio-appbar__divider" aria-hidden="true" />
          <button type="button" className="trio-hdr-btn-reset trio-farm-select" aria-haspopup="listbox">
            <span className="trio-farm-select__value">
              <span className="trio-farm-select__avatar">FF</span>
              <span className="trio-farm-select__name">Freedom farm</span>
            </span>
            <ChevronDownIcon />
          </button>
          <button type="button" className="trio-hdr-btn-reset trio-appbar__iconbtn" aria-label="Farm overview">
            <BarnIcon />
          </button>
          <span className="trio-appbar__divider" aria-hidden="true" />
        </div>

        <div className="trio-tabs" role="tablist">
          {TABS.map((t) => {
            const active = t.id === activeId;
            return (
              <div
                key={t.id}
                role="tab"
                aria-selected={active}
                tabIndex={0}
                className={'trio-tab' + (active ? ' trio-tab--active' : '')}
              >
                <span className="trio-tab__label">
                  <HomeIcon />
                  <span className="trio-tab__text">{t.label}</span>
                </span>
                <button type="button" className="trio-hdr-btn-reset trio-tab__close" aria-label={`Close ${t.label}`}>
                  <CloseIcon />
                </button>
              </div>
            );
          })}
        </div>

        <button type="button" className="trio-hdr-btn-reset trio-appbar__iconbtn trio-appbar__plus" aria-label="Add house tab" style={{ padding: 0 }}>
          <PlusIcon />
        </button>
      </div>

      <div className="trio-appbar__right">
        <button type="button" className="trio-hdr-btn-reset trio-appbar__help" aria-label="Help">
          <HelpIcon />
        </button>
        <div className="trio-appbar__user">
          <div className="trio-avatar" aria-label="User Name, has notifications">
            UN
            <span className="trio-avatar__badge" />
          </div>
          <span className="trio-appbar__username">User Name</span>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Main header (7854:12641)                                          */
/* ------------------------------------------------------------------ */

export function TrioMainHeader(props: {
  day: number;
  time: string;
  house: string;
  onMenu?: () => void;
  onAlarm?: () => void;
  onHome?: () => void;
}) {
  const { day, time, house, onMenu, onAlarm, onHome } = props;
  const blocks: Array<[string, ReactNode]> = [
    ['HOUSE', house],
    ['DAY', day],
    ['TIME', time],
  ];
  return (
    <div className="trio-mainheader">
      <div className="trio-mainheader__left">
        <div className="trio-mainheader__btns">
          <button type="button" className="trio-hdr-btn-reset trio-mainheader__btn" aria-label="Back" onClick={onHome}>
            <BackIcon />
          </button>
          <button type="button" className="trio-hdr-btn-reset trio-mainheader__btn" aria-label="Menu" onClick={onMenu}>
            <MenuIcon />
          </button>
        </div>
        <span className="trio-mainheader__line" aria-hidden="true" />
        <div className="trio-mainheader__time">
          {blocks.map(([label, value]) => (
            <div key={label} className="trio-mainheader__block">
              <span className="trio-mainheader__label">{label}</span>
              <span className="trio-mainheader__value">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="trio-mainheader__right">
        <div className="trio-mainheader__btns">
          <button type="button" className="trio-hdr-btn-reset trio-mainheader__btn" aria-label="Language">
            <GlobeIcon />
          </button>
          <button type="button" className="trio-hdr-btn-reset trio-mainheader__btn" aria-label="Network">
            <WifiIcon />
          </button>
          <button type="button" className="trio-hdr-btn-reset trio-mainheader__btn" aria-label="Alarms" onClick={onAlarm}>
            <BellIcon />
          </button>
          <button type="button" className="trio-hdr-btn-reset trio-mainheader__btn" aria-label="Dashboard">
            <ControllerIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Status bar (7792:2198)                                            */
/* ------------------------------------------------------------------ */

/** House mode values per PRD: Grow-out / 1st brood / 2nd brood / Empty / Pre heat. */
export function TrioStatusBar(props: { houseName: string; houseMode: string; onOutputStatus?: () => void }) {
  const { houseName, houseMode, onOutputStatus } = props;
  return (
    <div className="trio-statusbar">
      <div className="trio-statusbar__house">
        <h1 className="trio-statusbar__title">{houseName}</h1>
        <span className="trio-statusbar__mode" title="House mode">{houseMode}</span>
      </div>

      <div className="trio-statusbar__env">
        <div className="trio-weather" aria-label="Outside conditions">
          <span className="trio-weather__outside">
            <CloudSunIcon />
            Outside
          </span>
          <div className="trio-weather__metrics">
            <span className="trio-weather__metric" title="Temperature">
              <ThermoSunIcon />
              <span className="trio-weather__value">
                <span className="trio-weather__num">24.3°</span>
                <span className="trio-weather__unit">C</span>
              </span>
            </span>
            <span className="trio-weather__sep" aria-hidden="true" />
            <span className="trio-weather__metric" title="Humidity">
              <DropletIcon />
              <span className="trio-weather__value">
                <span className="trio-weather__num">45.1</span>
                <span className="trio-weather__unit">%</span>
              </span>
            </span>
            <span className="trio-weather__sep" aria-hidden="true" />
            <span className="trio-weather__metric trio-weather__metric--wide" title="Light">
              <SunIcon />
              <span className="trio-weather__value">
                <span className="trio-weather__num">25</span>
                <span className="trio-weather__unit">KJ</span>
              </span>
            </span>
            <span className="trio-weather__sep" aria-hidden="true" />
            <span className="trio-weather__metric trio-weather__metric--wide" title="Wind">
              <WindIcon />
              <span className="trio-weather__value" style={{ gap: 0 }}>
                <span className="trio-weather__num">
                  120<span style={{ fontSize: '15.48px', verticalAlign: 'top' }}>°</span>
                </span>
                <span className="trio-weather__unit">SE</span>
              </span>
            </span>
          </div>
        </div>

        <button type="button" className="trio-hdr-btn-reset trio-output-btn" onClick={onOutputStatus}>
          <RelayIcon />
          Output status
        </button>
      </div>
    </div>
  );
}
