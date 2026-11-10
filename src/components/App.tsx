"use client";

import {
  IconAdjustmentsHorizontal,
  IconLayoutGrid,
  IconList,
  IconLogout,
  IconPlus,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, uploadSong as sendSong } from "@/lib/client";
import { danceType, formatDate } from "@/lib/derive";
import { readPref, writePref } from "@/lib/prefs";
import { usePill } from "@/lib/usePill";
import type {
  AppData,
  Choreographer,
  ClassItem,
  Combo,
  Dance,
  Dancer,
  Progress,
  Settings,
} from "@/lib/types";
import ClassesView from "./ClassesView";
import ComboForm from "./ComboForm";
import Credit from "./Credit";
import CombosView, { UNSORTED } from "./CombosView";
import DanceForm from "./DanceForm";
import HomeView from "./HomeView";
import DancesView, { type View } from "./DancesView";
import PeopleView from "./PeopleView";
import PersonForm from "./PersonForm";
import LogoMark from "./LogoMark";
import { HomeSkeleton, PageSkeleton } from "./Loading";
import PlayerModal from "./PlayerModal";
import SettingsModal from "./SettingsModal";

type Section = "home" | "dances" | "combos";
type Tab =
  "home" | "dances" | "dancers" | "choreographers" | "combos" | "classes";

const SECTIONS: Record<Section, { label: string; tabs: Tab[] }> = {
  home: { label: "Home", tabs: ["home"] },
  dances: { label: "Dances", tabs: ["dances", "dancers", "choreographers"] },
  combos: { label: "Combos", tabs: ["combos", "classes"] },
};
const sectionOf = (tab: Tab): Section =>
  tab === "home"
    ? "home"
    : SECTIONS.dances.tabs.includes(tab)
      ? "dances"
      : "combos";

// The first tab of each section is its overview.
const TAB_LABEL: Record<Tab, string> = {
  home: "Home",
  dances: "Overview",
  dancers: "Dancers",
  choreographers: "Choreographers",
  combos: "Overview",
  classes: "Classes",
};

const NEW_LABEL: Partial<Record<Tab, string>> = {
  dances: "New dance",
  dancers: "New dancer",
  choreographers: "New choreographer",
  combos: "New combo",
};

const INTRO: Record<Tab, string> = {
  home: "",
  dances: "Here is where your dances stand",
  dancers: "Your dancers and the dances they're in",
  choreographers: "Who is choreographing what",
  combos: "Quick combos for your classes, newest first",
  classes: "The classes you teach. Combos are grouped by these",
};

type Editing =
  | { kind: "dance"; item: Dance | null }
  | { kind: "dancer"; item: Dancer | null }
  | { kind: "choreographer"; item: Choreographer | null }
  | { kind: "combo"; item: Combo | null }
  | null;

type Playing =
  { kind: "dance"; item: Dance } | { kind: "combo"; item: Combo } | null;

export default function App() {
  const router = useRouter();
  const [data, setData] = useState<AppData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<Tab>("home");
  const [view, setView] = useState<View>("cards");
  const [editing, setEditing] = useState<Editing>(null);
  const [playing, setPlaying] = useState<Playing>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [notice, setNotice] = useState("");

  const refresh = useCallback(
    () =>
      api
        .get<AppData>("/api/data")
        .then((d) => {
          setData(d);
          setLoadError("");
        })
        .catch((e: Error) => setLoadError(e.message)),
    [],
  );

  useEffect(() => {
    // Saved settings are read after the first fetch so server and client render the same markup.
    refresh().then(() => {
      setView(readPref<View>("view", ["cards", "list"], "cards"));
      // Links from the guide say where to land, like /?go=classes or /?go=settings.
      const go = new URLSearchParams(window.location.search).get("go");
      if (go) {
        const tabs: Tab[] = ["home", "dances", "dancers", "choreographers", "combos", "classes"];
        if ((tabs as string[]).includes(go)) setTab(go as Tab);
        if (go === "settings") setShowSettings(true);
        if (go === "new-dance") {
          setTab("dances");
          setEditing({ kind: "dance", item: null });
        }
        if (go === "new-combo") {
          setTab("combos");
          setEditing({ kind: "combo", item: null });
        }
        window.history.replaceState(null, "", window.location.pathname);
      }
    });
  }, [refresh]);

  useEffect(() => {
    // A file dropped outside a drop zone would otherwise open in the browser and leave the app.
    const block = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);

  const settings: Settings = data?.settings ?? {
    dances: true,
    combos: true,
    calendarDue: true,
  };
  const sections = (Object.keys(SECTIONS) as Section[]).filter(
    (s) => s === "home" || settings[s],
  );
  // A tab in a section that's turned off falls back to the first section still on.
  const current: Tab =
    sectionOf(tab) === "home" || settings[sectionOf(tab) as "dances" | "combos"]
      ? tab
      : "home";
  const section = sectionOf(current);

  const chooseView = (v: View) => {
    setView(v);
    writePref("view", v);
  };

  const chooseTab = (t: Tab) => {
    setTab(t);
    writePref("tab", t);
  };

  const goHome = () => {
    chooseTab("home");
    setEditing(null);
    setPlaying(null);
    setNotice("");
    refresh();
  };

  const changeStatus = async (dance: Dance, progress: Progress) => {
    setNotice("");
    // Show the new stage right away, then save it.
    setData(
      (d) =>
        d && {
          ...d,
          dances: d.dances.map((x) =>
            x.id === dance.id ? { ...x, progress } : x,
          ),
        },
    );
    try {
      await api.patch(`/api/dances/${dance.id}`, { ...dance, progress });
    } catch (e) {
      setNotice(
        `Couldn't change the stage of ${dance.name}. ${(e as Error).message}`,
      );
    }
    await refresh();
  };

  const uploadSong = async (
    dance: Dance,
    file: File,
    onProgress: (percent: number | null) => void,
  ) => {
    setNotice("");
    try {
      await sendSong(dance.id, file, data?.mode ?? "demo", onProgress);
    } catch (e) {
      setNotice(
        `Couldn't add the song to ${dance.name}. ${(e as Error).message}`,
      );
    }
    await refresh();
  };

  const remove = async (url: string) => {
    await api.del(url);
    await refresh();
  };

  const startNew = () => {
    if (current === "dances") setEditing({ kind: "dance", item: null });
    if (current === "dancers") setEditing({ kind: "dancer", item: null });
    if (current === "choreographers")
      setEditing({ kind: "choreographer", item: null });
    if (current === "combos") setEditing({ kind: "combo", item: null });
  };

  const addClass = async (name: string) => {
    await api.post("/api/classes", { name });
    await refresh();
  };
  const renameClass = async (item: ClassItem, name: string) => {
    await api.patch(`/api/classes/${item.id}`, { name });
    await refresh();
  };
  const viewClass = (item: ClassItem) => {
    writePref("comboClass", item.id);
    chooseTab("combos");
  };

  const dancers = data?.dancers ?? [];
  const dances = data?.dances ?? [];
  const choreographers = data?.choreographers ?? [];
  const combos = data?.combos ?? [];
  const classes = data?.classes ?? [];
  const nameOf = (id: string) => dancers.find((d) => d.id === id)?.name;
  const firstName = data?.who.name?.trim().split(/\s+/)[0] ?? "";
  const counts: Record<Tab, number> = {
    home: 0,
    dances: dances.length,
    dancers: dancers.length,
    choreographers: choreographers.length,
    combos: combos.length,
    classes: classes.length,
  };
  // New combos start in the class being viewed.
  const savedClass = readPref<string>("comboClass", null, "all");
  const startClass =
    classes.some((c) => c.id === savedClass) && savedClass !== UNSORTED
      ? savedClass
      : null;

  const navRef = usePill<HTMLElement>(section, sections.length);
  const subRef = usePill<HTMLElement>(current, section);
  const viewRef = usePill<HTMLDivElement>(view, current);
  const newLabel = NEW_LABEL[current];

  return (
    <div className="shell">
      <header className="header">
        <button className="brand" onClick={goHome} aria-label="tempoh home">
          <LogoMark />
          <span className="wordmark">
            temp<b>oh</b>
          </span>
        </button>
        {sections.length > 1 && (
          <nav className="nav has-pill" aria-label="Sections" ref={navRef}>
            <span className="pill" aria-hidden="true" />
            {sections.map((s) => (
              <button
                key={s}
                data-pill={s}
                aria-current={section === s ? "page" : undefined}
                onClick={() => chooseTab(SECTIONS[s].tabs[0])}
              >
                {SECTIONS[s].label}
              </button>
            ))}
          </nav>
        )}
        <div className="header-tools">
          {data && (
            <button
              className="round-btn"
              aria-label="Settings"
              title="Settings"
              onClick={() => setShowSettings(true)}
            >
              <IconAdjustmentsHorizontal size={19} stroke={1.7} />
            </button>
          )}
          {data && (
            <button
              className="round-btn logout"
              aria-label={data.mode === "demo" ? "Leave demo" : "Log out"}
              title={data.mode === "demo" ? "Leave demo" : "Log out"}
              onClick={async () => {
                await api.post("/api/auth/logout", {});
                router.replace("/welcome");
              }}
            >
              <IconLogout size={18} />
            </button>
          )}
        </div>
      </header>

      {section !== "home" && (
        <nav
          className="subnav"
          aria-label={`${SECTIONS[section].label} sections`}
          ref={subRef}
        >
          <span className="sub-pill" aria-hidden="true" />
          {SECTIONS[section].tabs.map((t) => (
            <button
              key={t}
              data-pill={t}
              aria-current={current === t ? "page" : undefined}
              onClick={() => chooseTab(t)}
            >
              {TAB_LABEL[t]}
              {data && <span className="sub-count">{counts[t]}</span>}
            </button>
          ))}
        </nav>
      )}

      {section !== "home" && (
        <div className="page-head">
          <div className="greeting" key={current}>
            <h1>{firstName ? `Hi, ${firstName}` : "Hi there"}</h1>
            {data?.mode === "demo" ? (
              <p>
                You&apos;re trying the demo with sample data. Changes only last
                while it&apos;s open.{" "}
                <a className="link" href="/api/auth/login">
                  Sign in with Notion
                </a>{" "}
                to use your own.
              </p>
            ) : (
              <p>
                {INTRO[current]}
                {data?.mode === "notion" && data.who.workspace
                  ? `, from ${data.who.workspace} in Notion`
                  : ""}
                .
              </p>
            )}
          </div>
          <div className="head-actions">
            {current === "dances" && (
              <div className="toggle-group has-pill" ref={viewRef}>
                <span className="pill" aria-hidden="true" />
                <button
                  className="icon-toggle"
                  data-pill="cards"
                  aria-pressed={view === "cards"}
                  aria-label="Card view"
                  onClick={() => chooseView("cards")}
                >
                  <IconLayoutGrid size={17} />
                </button>
                <button
                  className="icon-toggle"
                  data-pill="list"
                  aria-pressed={view === "list"}
                  aria-label="List view"
                  onClick={() => chooseView("list")}
                >
                  <IconList size={17} />
                </button>
              </div>
            )}
            {newLabel && (
              <button
                className="btn-primary new-btn"
                onClick={startNew}
                disabled={!data}
                aria-label={newLabel}
              >
                <span className="btn-label">{newLabel}</span>
                <span className="plus-dot">
                  <IconPlus size={15} stroke={2.4} />
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {notice && <p className="error notice">{notice}</p>}
      {loadError && (
        <div className="tile empty-state">
          Couldn&apos;t load your data. {loadError}
        </div>
      )}
      {!data && !loadError && (section === "home" ? <HomeSkeleton /> : <PageSkeleton />)}

      {data && current === "home" && (
        <HomeView
          data={data}
          firstName={firstName}
          onOpen={(s) => chooseTab(SECTIONS[s].tabs[0])}
          onNew={(kind) => setEditing({ kind, item: null })}
          onCalendar={() => setShowSettings(true)}
        />
      )}

      {data && current === "dances" && (
        <DancesView
          dances={dances}
          dancers={dancers}
          choreographers={choreographers}
          view={view}
          onPlay={(item) => setPlaying({ kind: "dance", item })}
          onStatus={changeStatus}
          onDropSong={uploadSong}
          onEdit={(item) => setEditing({ kind: "dance", item })}
          onDelete={(d) => remove(`/api/dances/${d.id}`)}
        />
      )}

      {data && current === "dancers" && (
        <PeopleView
          kind="dancer"
          people={dancers}
          dancesFor={(p) => dances.filter((d) => d.dancerIds.includes(p.id))}
          onEdit={(item) => setEditing({ kind: "dancer", item })}
          onDelete={(p) => remove(`/api/dancers/${p.id}`)}
        />
      )}

      {data && current === "choreographers" && (
        <PeopleView
          kind="choreographer"
          people={choreographers}
          dancesFor={(p) => dances.filter((d) => d.choreographerId === p.id)}
          onEdit={(item) => setEditing({ kind: "choreographer", item })}
          onDelete={(p) => remove(`/api/choreographers/${p.id}`)}
        />
      )}

      {data && current === "combos" && (
        <CombosView
          combos={combos}
          classes={classes}
          onPlay={(item) => setPlaying({ kind: "combo", item })}
          onEdit={(item) => setEditing({ kind: "combo", item })}
          onDelete={(c) => remove(`/api/combos/${c.id}`)}
          onNotice={setNotice}
        />
      )}

      {data && current === "classes" && (
        <ClassesView
          classes={classes}
          combos={combos}
          onAdd={addClass}
          onRename={renameClass}
          onRemove={(c) => remove(`/api/classes/${c.id}`)}
          onView={viewClass}
        />
      )}

      {editing?.kind === "dance" && (
        <DanceForm
          mode={data?.mode ?? "demo"}
          dance={editing.item}
          dancers={dancers}
          choreographers={choreographers}
          onClose={() => setEditing(null)}
          onSaved={refresh}
        />
      )}
      {(editing?.kind === "dancer" || editing?.kind === "choreographer") && (
        <PersonForm
          kind={editing.kind}
          person={editing.item}
          onClose={() => setEditing(null)}
          onSaved={refresh}
        />
      )}
      {editing?.kind === "combo" && (
        <ComboForm
          mode={data?.mode ?? "demo"}
          combo={editing.item}
          classes={classes}
          classId={startClass}
          onClose={() => setEditing(null)}
          onSaved={refresh}
        />
      )}

      {playing?.kind === "dance" && (
        <PlayerModal
          mode={data?.mode ?? "demo"}
          dance={dances.find((d) => d.id === playing.item.id) ?? playing.item}
          subtitle={[
            danceType(playing.item.dancerIds.length),
            playing.item.dancerIds.map(nameOf).filter(Boolean).join(", "),
          ]
            .filter(Boolean)
            .join(", ")}
          onClose={() => setPlaying(null)}
          onUploaded={refresh}
        />
      )}
      {playing?.kind === "combo" && (
        <PlayerModal
          mode={data?.mode ?? "demo"}
          dance={combos.find((c) => c.id === playing.item.id) ?? playing.item}
          subtitle={[
            classes.find((c) => c.id === playing.item.classId)?.name,
            playing.item.date ? formatDate(playing.item.date) : null,
          ]
            .filter(Boolean)
            .join(", ")}
          onClose={() => setPlaying(null)}
          onUploaded={refresh}
        />
      )}

      {showSettings && data && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSaved={(next) => {
            setData((d) => d && { ...d, settings: next });
            refresh();
          }}
        />
      )}
      <Credit />
    </div>
  );
}
