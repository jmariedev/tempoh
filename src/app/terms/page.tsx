import LogoMark from "@/components/LogoMark";
export const metadata = { title: "Terms · tempoh" };

export default function TermsPage() {
  return (
    <div className="legal">
      <div className="tile legal-card">
        <a href="/welcome" className="brand">
          <LogoMark />
          <span className="wordmark">
            temp<b>oh</b>
          </span>
        </a>
        <h1>Terms</h1>
        <p>
          tempoh is a free personal portfolio project, offered as is, without any guarantee that it
          will always be available or work without errors.
        </p>
        <p>
          Your dances are saved in your own Notion workspace, so keep your own copies of anything
          important there. Notion&apos;s own terms also apply to your workspace and any files you upload.
        </p>
        <p>
          Please only add information you have permission to keep, such as your dancers&apos; names and
          ages, and don&apos;t use the app for anything unlawful.
        </p>
        <p>These terms may change as the project changes.</p>
      </div>
    </div>
  );
}
