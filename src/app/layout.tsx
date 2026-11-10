import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

const description =
  "A choreography tracker for dance teachers. Keep dances, dancers, songs, costumes and solo payments in one place, saved in your own Notion.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://tempohapp.vercel.app"),
  title: "tempoh",
  description,
  applicationName: "tempoh",
  openGraph: {
    title: "tempoh",
    description,
    siteName: "tempoh",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "tempoh",
    description,
  },
  // Lets the app open full screen when added to an iPhone home screen.
  appleWebApp: { capable: true, title: "tempoh", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#E9E9EC",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
