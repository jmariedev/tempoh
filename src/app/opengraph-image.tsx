import { ImageResponse } from "next/og";

export const alt = "tempoh, a choreography tracker for dance teachers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Plus Jakarta Sans at the two weights the wordmark uses, trimmed to the letters on the card.
async function font(weight: number, text: string) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@${weight}&text=${encodeURIComponent(text)}`,
  ).then((r) => r.text());
  const url = css.match(/src: url\((.+?)\) format/)?.[1];
  if (!url) throw new Error("Font not found");
  return fetch(url).then((r) => r.arrayBuffer());
}

const tagline = "Dances, dancers, songs and stages, saved in your own Notion.";
const stages = ["#D5D9E0", "#9CC8F2", "#F4A48C", "#8FD3C7", "#F5CF7A"];

export default async function OpenGraphImage() {
  const letters = `tempoh${tagline}A choreography tracker for dance teachers`;
  const [regular, bold] = await Promise.all([font(400, letters), font(800, letters)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#E9E9EC",
          padding: 48,
          fontFamily: "Jakarta",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "#FFFFFF",
            borderRadius: 48,
            padding: "64px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 120,
                background: "#18181B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="62" height="62" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeLinecap="round">
                <path d="M12 3a9 9 0 1 1-9 9" strokeWidth="2.4" />
                <circle cx="12" cy="12" r="2.8" fill="#FFFFFF" stroke="none" />
                <circle cx="5.6" cy="5.6" r="1.5" fill="#FFFFFF" stroke="none" />
              </svg>
            </div>
            <div style={{ display: "flex", fontSize: 120, color: "#18181B", letterSpacing: -4 }}>
              <span style={{ fontWeight: 400 }}>temp</span>
              <span style={{ fontWeight: 800 }}>oh</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 44, fontWeight: 800, color: "#18181B" }}>A choreography tracker for dance teachers</div>
            <div style={{ fontSize: 32, fontWeight: 400, color: "#6B6B73" }}>{tagline}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              {stages.map((c) => (
                <div key={c} style={{ width: 72, height: 16, borderRadius: 8, background: c }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Jakarta", data: regular, weight: 400, style: "normal" },
        { name: "Jakarta", data: bold, weight: 800, style: "normal" },
      ],
    },
  );
}
