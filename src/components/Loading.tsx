// Loading pieces: a small spinner for busy buttons, and a page skeleton shaped like the real layout.

export function Spinner({ label }: { label?: string }) {
  return <span className="spinner" role={label ? "status" : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}

export function PageSkeleton() {
  return (
    <div className="skeleton" role="status" aria-label="Loading your dances">
      <div className="stat-row">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="stat skel-tile" style={{ animationDelay: `${i * 80}ms` }}>
            <span className="skel skel-num" />
            <span className="skel skel-line short" />
            <span className="skel skel-bar" />
          </div>
        ))}
      </div>
      <div className="grid">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="tile card skel-card" style={{ animationDelay: `${i * 120}ms` }}>
            <div className="card-top">
              <div style={{ flex: 1 }}>
                <span className="skel skel-line short" />
                <span className="skel skel-title" />
              </div>
              <span className="skel skel-circle" />
            </div>
            <span className="skel skel-row" />
            <span className="skel skel-row" />
            <span className="skel skel-row" />
            <div className="card-foot">
              <span className="skel skel-line short" />
              <span className="skel skel-line tiny" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Home while it loads: the greeting, the three cards and a week. */
export function HomeSkeleton() {
  return (
    <div className="skeleton home" role="status" aria-label="Loading your week">
      <div className="home-hello">
        <span className="skel skel-line short" />
        <span className="skel skel-title" style={{ width: 280, height: 32, marginTop: 10 }} />
      </div>
      <div className="home-cards">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="tile card skel-card" style={{ minHeight: 220 }}>
            <span className="skel skel-line short" />
            <span className="skel skel-num" style={{ width: 60, height: 40 }} />
            <span className="skel skel-row" />
            <span className="skel skel-row" />
          </div>
        ))}
      </div>
      <div className="tile week skel-card">
        <span className="skel skel-line short" />
        <div className="week-grid">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="week-day" />
          ))}
        </div>
      </div>
    </div>
  );
}
