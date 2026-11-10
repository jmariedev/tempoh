import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import Credit from "@/components/Credit";
import LogoMark from "@/components/LogoMark";
import GuideNav from "./GuideNav";

export const metadata: Metadata = {
  title: "How it works · tempoh",
  description:
    "A step by step guide to tempoh: your week, dances, songs, dancers, combos, settings and your phone.",
};

// Small drawings of tempoh's own screens. They're simplified on purpose, so they don't go stale.
const Bar = ({
  w = "80%",
  h = 8,
  c = "var(--line)",
}: {
  w?: string;
  h?: number;
  c?: string;
}) => <span className="g-bar" style={{ width: w, height: h, background: c }} />;

function Step({
  id,
  n,
  title,
  art,
  label,
  go,
  children,
}: {
  id: string;
  n: number;
  title: string;
  art: ReactNode;
  label: string;
  /** Where "Show me" opens in the app. */
  go?: { href: string; text: string };
  children: ReactNode;
}) {
  return (
    <section id={id} className="tile g-step">
      <figure className="g-art" role="img" aria-label={label}>
        {art}
      </figure>
      <div className="g-text">
        <span className="g-num">Step {n}</span>
        <h2>{title}</h2>
        <ol>{children}</ol>
        {go && (
          <Link className="g-show" href={go.href}>
            {go.text}
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </section>
  );
}

const STEPS: [string, string][] = [
  ["start", "Get started"],
  ["home", "Home is your week"],
  ["dances", "Track your dances"],
  ["songs", "Add and play songs"],
  ["people", "Dancers and choreographers"],
  ["combos", "Combos for your classes"],
  ["settings", "Settings"],
  ["phone", "On your phone"],
  ["calendar", "Connect your calendar"],
];

export default function GuidePage() {
  return (
    <div className="shell guide">
      <header className="header">
        <Link className="brand" href="/" aria-label="tempoh home">
          <LogoMark />
          <span className="wordmark">
            temp<b>oh</b>
          </span>
        </Link>
        <Link className="btn-primary g-back" href="/">
          Back to tempoh
        </Link>
      </header>

      <div className="g-intro">
        <h1>How tempoh works</h1>
        <p>
          Everything you track lives in your own Notion. tempoh gives it a calm
          place to work: your week, your competition dances, and the combos you
          teach in class.
        </p>
      </div>

      <div className="g-layout">
        <GuideNav steps={STEPS} />
        <div className="g-main">
          <div className="g-grid">
            <Step
              id="start"
              go={{ href: "/welcome", text: "Open the welcome page" }}
              n={1}
              title="Get started"
              label="The welcome screen with Sign in with Notion and Try the demo"
              art={
                <div className="g-card" style={{ width: 180, gap: 10 }}>
                  <span className="g-mini-word">
                    temp<b>oh</b>
                  </span>
                  <Bar w="90%" />
                  <Bar w="70%" />
                  <span className="g-btn dark ring">Sign in with Notion</span>
                  <span className="g-btn">Try the demo</span>
                </div>
              }
            >
              <li>Press Sign in with Notion.</li>
              <li>
                When Notion asks, choose to copy the tempoh template. It adds a
                tempoh page with your Dances, Dancers, Choreographers, Combos
                and Classes.
              </li>
              <li>
                Just looking? Try the demo. It uses sample data and resets when
                you leave.
              </li>
            </Step>

            <Step
              id="home"
              go={{ href: "/?go=home", text: "Show me Home" }}
              n={2}
              title="Home is your week"
              label="Home with a week of events and cards for Dances and Combos"
              art={
                <div className="g-col">
                  <span className="g-small-title">Good afternoon</span>
                  <div className="g-card g-week">
                    {[2, 1, 2, 0, 1, 1, -1].map((n, i) => (
                      <span
                        key={i}
                        className={`g-day${i === 4 ? " today" : ""}`}
                      >
                        {n === -1 ? (
                          <Bar w="100%" h={8} c="var(--ink)" />
                        ) : (
                          Array.from({ length: n }, (_, j) => (
                            <Bar key={j} w="100%" h={8} c="#cde3f8" />
                          ))
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="g-three">
                    <span className="g-card g-stat">
                      Dances<b>6</b>
                    </span>
                    <span className="g-card g-stat">
                      Combos<b>7</b>
                    </span>
                    <span className="g-card g-stat dark">Quick add</span>
                  </div>
                </div>
              }
            >
              <li>
                See this week from your calendar, with today outlined. Black
                chips are tempoh due dates.
              </li>
              <li>
                Use the arrows to look ahead or back, and Today to come home.
              </li>
              <li>
                Tap Dances or Combos to jump in, or use Quick add for something
                new.
              </li>
            </Step>

            <Step
              id="dances"
              go={{ href: "/?go=new-dance", text: "Start a new dance" }}
              n={3}
              title="Track your dances"
              label="A dance card with its type, details and stage picker"
              art={
                <div className="g-card" style={{ width: 190, gap: 8 }}>
                  <span className="g-row-between">
                    <span className="g-pill dark">Solo</span>
                    <span className="g-dot-btn" />
                  </span>
                  <b className="g-name">Midnight Bloom</b>
                  <Bar w="100%" h={20} c="var(--soft)" />
                  <Bar w="100%" h={20} c="var(--soft)" />
                  <span className="g-stage">
                    <i style={{ background: "#F4A48C" }} />
                    Cleaning
                    <span className="g-segs">
                      <i />
                      <i />
                      <i />
                      <i className="off" />
                    </span>
                  </span>
                </div>
              }
            >
              <li>
                Press New dance. Add a name, dancers, performance date, costume
                and notes. Solos also track the contract and payment.
              </li>
              <li>
                Change a stage right on the card: Scheduled, In choreography,
                Cleaning, Done or Waiting.
              </li>
              <li>
                Tap a stage tile at the top to show only those dances, or filter
                by type.
              </li>
            </Step>

            <Step
              id="songs"
              go={{ href: "/?go=dances", text: "Show me my dances" }}
              n={4}
              title="Add and play songs"
              label="A song file being dragged onto a drop area, and the player"
              art={
                <div
                  className="g-col"
                  style={{ justifyContent: "center", width: "100%" }}
                >
                  <div className="g-card g-drop">
                    <span className="g-dot-btn">↑</span>
                    <b>Drop to add it</b>
                    <span className="g-file">Runway.m4a</span>
                  </div>
                  <div className="g-card g-player">
                    <span className="g-dot-btn" />
                    <span className="g-track">
                      <i />
                    </span>
                  </div>
                </div>
              }
            >
              <li>
                Drag an MP3 or M4A straight onto a dance or combo, or press its
                upload button and choose one.
              </li>
              <li>
                Press play to open the player. Drag the bar to find a spot, or
                skip 5 seconds either way.
              </li>
              <li>
                Songs are private to you. Replace a song any time from the
                player.
              </li>
            </Step>

            <Step
              id="people"
              go={{ href: "/?go=dancers", text: "Show me my dancers" }}
              n={5}
              title="Dancers and choreographers"
              label="The Dances tabs with Dancers selected and a list of dancers"
              art={
                <div className="g-col">
                  <div className="g-tabs">
                    <span>Overview</span>
                    <span className="on">Dancers 11</span>
                    <span>Choreographers</span>
                  </div>
                  {[
                    ["Ava Reyes", "Age 12, Midnight Bloom"],
                    ["Tess Moon", "Age 8, set by hand"],
                    ["Zoe Kim", "Age 14, Echoes"],
                  ].map(([n, d]) => (
                    <span key={n} className="g-card g-person">
                      <b>{n}</b>
                      <span>{d}</span>
                    </span>
                  ))}
                </div>
              }
            >
              <li>Find them under Dances, next to Overview.</li>
              <li>
                Add a birthdate and tempoh keeps their age current. Don&apos;t
                know it? Set an age instead.
              </li>
              <li>
                You can also add a dancer right from the dance form while
                picking who&apos;s in it.
              </li>
            </Step>

            <Step
              id="combos"
              go={{ href: "/?go=classes", text: "Set up my classes" }}
              n={6}
              title="Combos for your classes"
              label="Combos grouped by class with a remove and undo bar"
              art={
                <div
                  className="g-col"
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <span className="g-small-title">Jazz 2</span>
                  {[
                    ["4", "Chaine turns into kick ball change"],
                    ["28", "Leaps across the floor"],
                  ].map(([d, n]) => (
                    <span key={n} className="g-card g-combo">
                      <span className="g-date">{d}</span>
                      <b>{n}</b>
                    </span>
                  ))}
                  <span className="g-undo">
                    Removed Animal walks<span>Undo</span>
                  </span>
                </div>
              }
            >
              <li>Add your classes once, under Combos, then Classes.</li>
              <li>
                Press New combo. A name and class are enough. The date starts on
                today, and a song and notes are optional.
              </li>
              <li>
                Remove a combo with one tap. Changed your mind? Press Undo
                within a few seconds.
              </li>
            </Step>

            <Step
              id="settings"
              go={{ href: "/?go=settings", text: "Open Settings" }}
              n={7}
              title="Make it yours in Settings"
              label="Settings with switches for Dances and Combos and a connected calendar"
              art={
                <div className="g-col" style={{ width: "100%" }}>
                  <span className="g-small-title">Settings</span>
                  {["Dances", "Combos"].map((n) => (
                    <span key={n} className="g-card g-switch-row">
                      {n}
                      <span className="g-switch" />
                    </span>
                  ))}
                  <span className="g-card g-switch-row">
                    <span className="g-cal-dot" />
                    <span style={{ flex: 1 }}>Studio schedule</span>
                    <span className="faint">Connected</span>
                  </span>
                </div>
              }
            >
              <li>Open Settings from the sliders button at the top right.</li>
              <li>
                Only teach classes? Turn Dances off. Only competition work? Turn
                Combos off. Nothing is deleted.
              </li>
              <li>
                Connect your calendar so your week shows on Home.{" "}
                <a href="#calendar">See how below</a>.
              </li>
            </Step>

            <Step
              id="phone"
              n={8}
              title="Keep it on your phone"
              label="A phone home screen with the tempoh app icon added"
              art={
                <div className="g-phone">
                  <div>
                    {Array.from({ length: 6 }, (_, i) => (
                      <span key={i} className={i === 4 ? "app" : ""}>
                        {i === 4 && <i />}
                      </span>
                    ))}
                  </div>
                </div>
              }
            >
              <li>
                Open tempohapp.vercel.app in Safari on iPhone, or Chrome on
                Android.
              </li>
              <li>
                iPhone: press Share, then Add to Home Screen. Android: open the
                menu, then Install app.
              </li>
              <li>
                tempoh opens full screen like an app, so songs are one tap away
                in the studio.
              </li>
            </Step>
          </div>

          <section id="calendar" className="tile g-calendar">
            <div className="g-intro" style={{ margin: 0 }}>
              <h2>Connect your calendar</h2>
              <p>Three steps, about a minute. You only do this once.</p>
            </div>
            <div className="g-cal-grid">
              <div>
                <figure
                  className="g-art tall"
                  role="img"
                  aria-label="A calendar app's sidebar with a calendar's menu open on Settings and sharing"
                >
                  <div className="g-col" style={{ width: "100%" }}>
                    <span className="g-caps">MY CALENDARS</span>
                    <span className="g-card g-switch-row ring">
                      <span className="g-cal-dot" />
                      <span style={{ flex: 1 }}>Studio schedule</span>⋮
                    </span>
                    <span className="g-switch-row plain">
                      <span
                        className="g-cal-dot"
                        style={{ background: "#F4A48C" }}
                      />
                      Personal
                    </span>
                    <span className="g-card g-menu">
                      <span>Display this only</span>
                      <span>Hide from list</span>
                      <span className="on">Settings and sharing</span>
                    </span>
                  </div>
                </figure>
                <h3>
                  <span className="g-step-dot">1</span>Open the calendar&apos;s
                  settings
                </h3>
                <p>
                  On a computer, open Google Calendar. Hover the calendar under
                  My calendars, click the three dots, then Settings and sharing.
                </p>
              </div>
              <div>
                <figure
                  className="g-art tall"
                  role="img"
                  aria-label="The Integrate calendar section with the secret address field and a copy button"
                >
                  <div className="g-col" style={{ width: "100%" }}>
                    <b className="g-name">Integrate calendar</b>
                    <span className="g-caps">
                      Public address in iCal format
                    </span>
                    <Bar w="100%" h={26} c="var(--tile)" />
                    <span className="g-card g-secret ring">
                      <b>Secret address in iCal format</b>
                      <span>
                        <span className="g-dots">••••••••••</span>
                        <span className="g-pill dark">Copy</span>
                      </span>
                    </span>
                  </div>
                </figure>
                <h3>
                  <span className="g-step-dot">2</span>Copy the secret address
                </h3>
                <p>
                  Scroll to Integrate calendar. Copy the Secret address in iCal
                  format, not the public one. Google may ask you to confirm
                  first.
                </p>
              </div>
              <div>
                <figure
                  className="g-art tall"
                  role="img"
                  aria-label="tempoh's settings with the calendar link pasted and the Connect button"
                >
                  <div className="g-col" style={{ width: "100%" }}>
                    <b className="g-name">Settings</b>
                    <span className="g-caps">CALENDAR</span>
                    <span className="g-card g-col" style={{ gap: 8 }}>
                      <span className="g-paste ring">
                        https://calendar.google.com/calendar/ical/...
                      </span>
                      <span
                        className="g-pill dark"
                        style={{ alignSelf: "flex-end" }}
                      >
                        Connect
                      </span>
                    </span>
                    <span className="g-done">✓ Your week shows on Home</span>
                  </div>
                </figure>
                <h3>
                  <span className="g-step-dot">3</span>Paste it into tempoh
                </h3>
                <p>
                  Open tempoh&apos;s Settings, paste the address under Calendar
                  and press Connect. Your week shows up on Home.
                </p>
              </div>
            </div>
            <Link
              className="g-show"
              href="/?go=settings"
              style={{ marginTop: 18 }}
            >
              Open Settings to connect
              <span aria-hidden="true">→</span>
            </Link>
            <p className="g-fine">
              Keep the secret address private. If it&apos;s ever shared by
              mistake, reset it in the same spot in Google and paste the new one
              into tempoh. Apple Calendar and Outlook have a similar private
              link.
            </p>
          </section>
        </div>
      </div>

      <div className="g-end">
        <div>
          <b>Your data stays yours</b>
          <span>
            Everything is saved in your own Notion, so you can see and edit it
            there too. Keep the database and property names as they are so
            tempoh can find them.
          </span>
        </div>
        <Link href="/">Go to tempoh</Link>
      </div>
      <Credit />
    </div>
  );
}
