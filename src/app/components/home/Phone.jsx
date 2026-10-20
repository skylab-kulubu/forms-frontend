export function StatusBar({ time = "9:41" }) {
  return (
    <div className="f-phone-st" aria-hidden="true">
      <span>{time}</span>
      <span>
        <svg width="16" height="11" viewBox="0 0 16 11">
          <rect x="0" y="7" width="3" height="4" rx=".8" fill="currentColor" />
          <rect x="4.3" y="5" width="3" height="6" rx=".8" fill="currentColor" />
          <rect x="8.6" y="2.6" width="3" height="8.4" rx=".8" fill="currentColor" />
          <rect x="12.9" y="0" width="3" height="11" rx=".8" fill="currentColor" />
        </svg>
        <svg width="22" height="11" viewBox="0 0 22 11">
          <rect x=".5" y=".5" width="18" height="10" rx="3" fill="none" stroke="currentColor" opacity=".5" />
          <rect x="2" y="2" width="13" height="7" rx="1.6" fill="currentColor" />
          <rect x="19.6" y="3.6" width="1.6" height="3.8" rx=".8" fill="currentColor" opacity=".5" />
        </svg>
      </span>
    </div>
  );
}

export default function Phone({ children, className = "", screenClassName = "", scrollClassName = "", scrollRef, scroll = true, style }) {
  return (
    <div className={`f-phone ${className}`.trim()} style={style}>
      <div className={`f-phone-scr ${screenClassName}`.trim()}>
        <StatusBar />
        {scroll ? (
          <div ref={scrollRef} className={`f-phone-sc ${scrollClassName}`.trim()}>
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
