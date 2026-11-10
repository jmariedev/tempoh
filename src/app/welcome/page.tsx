import LogoMark from "@/components/LogoMark";
import { Suspense } from "react";
import WelcomeError from "./WelcomeError";

export const metadata = { title: "Welcome · tempoh" };

export default function WelcomePage() {
  return (
    <div className="login">
      <div className="tile login-card">
        <div className="brand">
          <LogoMark />
          <span className="wordmark">
            temp<b>oh</b>
          </span>
        </div>
        <p className="welcome-copy">
          A choreography tracker for dance teachers. Dances, dancers, songs, costumes and solo
          payments, all saved in your own Notion.
        </p>
        <Suspense fallback={null}>
          <WelcomeError />
        </Suspense>
        <a className="btn-primary login-button" href="/api/auth/login">
          Sign in with Notion
        </a>
        <a className="btn login-button" href="/api/demo">
          Try the demo
        </a>
        <p className="welcome-fine">
          Signing in copies an empty template into your Notion. Your dances stay in your
          workspace. <a href="/guide">How it works</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>
        </p>
      </div>
    </div>
  );
}
