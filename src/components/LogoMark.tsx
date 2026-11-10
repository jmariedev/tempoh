// The tempoh mark: a turn, drawn as an open circle with a center dot, on a black circle.
export default function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <span className="logo" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M12 3a9 9 0 1 1-9 9" strokeWidth="2.4" />
        <circle cx="12" cy="12" r="2.8" fill="currentColor" stroke="none" />
        <circle cx="5.6" cy="5.6" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}
