import LogoMark from "@/components/LogoMark";
export const metadata = { title: "Privacy · tempoh" };

export default function PrivacyPage() {
  return (
    <div className="legal">
      <div className="tile legal-card">
        <a href="/welcome" className="brand">
          <LogoMark />
          <span className="wordmark">
            temp<b>oh</b>
          </span>
        </a>
        <h1>Privacy</h1>
        <p>tempoh is a personal portfolio project. Here&apos;s what it does with your information.</p>
        <h2>Your dances stay in Notion</h2>
        <p>
          Dances, dancers, songs, costumes, notes and payments are saved in your own Notion workspace, in
          the pages you share with tempoh. The app reads and writes them only to show and update them
          for you.
        </p>
        <h2>What tempoh stores</h2>
        <p>
          To keep you signed in, tempoh stores your Notion workspace name and ID, your Notion name and
          email, the IDs of your three tempoh databases, and your Notion access token, which is
          encrypted. It also stores sign-in sessions, which end after 90 days or when you log out.
        </p>
        <h2>What it doesn&apos;t do</h2>
        <p>
          tempoh doesn&apos;t sell or share your information, show ads, or use analytics or tracking
          cookies. Its only cookies keep you signed in or keep your demo open.
        </p>
        <h2>Removing access</h2>
        <p>
          You can disconnect tempoh at any time in Notion under Settings, then Connections. The demo
          keeps its sample data only in the server&apos;s memory, and it&apos;s cleared regularly.
        </p>
      </div>
    </div>
  );
}
