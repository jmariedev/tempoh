import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "tempoh",
    short_name: "tempoh",
    description: "A choreography tracker for dance teachers. Dances, dancers, songs and stages, saved in your own Notion.",
    start_url: "/",
    display: "standalone",
    background_color: "#E9E9EC",
    theme_color: "#E9E9EC",
    icons: [
      { src: "/icon1.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon2", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
