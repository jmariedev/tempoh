import { ImageResponse } from "next/og";

// The app icon: the white turn mark on a black circle, over the app's light gray.
export function brandIcon(px: number) {
  const mark = Math.round(px * 0.62);
  const glyph = Math.round(mark * 0.52);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#E9E9EC",
        }}
      >
        <div
          style={{
            width: mark,
            height: mark,
            borderRadius: mark,
            background: "#18181B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeLinecap="round">
            <path d="M12 3a9 9 0 1 1-9 9" strokeWidth="2.4" />
            <circle cx="12" cy="12" r="2.8" fill="#FFFFFF" stroke="none" />
            <circle cx="5.6" cy="5.6" r="1.5" fill="#FFFFFF" stroke="none" />
          </svg>
        </div>
      </div>
    ),
    { width: px, height: px },
  );
}
