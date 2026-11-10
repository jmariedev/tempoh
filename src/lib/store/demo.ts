import { fromPlain } from "../richtext";
import { DEFAULT_SETTINGS, type Choreographer, type ClassItem, type Combo, type Dance, type Dancer, type Settings } from "../types";
import { DEMO_SONG_LIMIT } from "../songs";
import type { Store } from "./types";

// In-memory sample data used when no Notion token is set, so the app can be
// tried locally. Everything resets when the server restarts.

interface DemoState {
  dances: Dance[];
  dancers: Dancer[];
  choreographers: Choreographer[];
  combos: Combo[];
  classes: ClassItem[];
  settings: Settings;
  /** The demo starts with a made-up studio calendar, or a real link if someone connects one. */
  calendar: { kind: "sample" } | { kind: "link"; url: string; name: string } | null;
  songs: Map<string, { name: string; type: string; data: ArrayBuffer }>;
  nextId: number;
}

function seed(): DemoState {
  const choreographers: Choreographer[] = [{ id: "c1", name: "Jackie K." }];
  const dancers: Dancer[] = [
    { id: "p1", name: "Ava Reyes", birthdate: "2014-02-11", age: null },
    { id: "p2", name: "Mia Chen", birthdate: "2016-01-20", age: null },
    { id: "p3", name: "Lila Park", birthdate: "2015-03-02", age: null },
    { id: "p4", name: "Zoe Kim", birthdate: "2012-05-09", age: null },
    { id: "p5", name: "Ella Ruiz", birthdate: "2012-08-30", age: null },
    { id: "p6", name: "Ivy Ford", birthdate: "2012-04-14", age: null },
    { id: "p7", name: "Nora Patel", birthdate: "2011-06-03", age: null },
    { id: "p8", name: "June Ito", birthdate: "2017-09-12", age: null },
    { id: "p9", name: "Remi Cole", birthdate: "2018-02-25", age: null },
    { id: "p10", name: "Sadie Lund", birthdate: "2017-11-07", age: null },
    { id: "p11", name: "Tess Moon", birthdate: null, age: 8 },
  ];
  const base = {
    choreographerId: "c1",
    songTitle: "",
    costume: [],
    contract: null,
    contractDate: null,
    payment: null,
    amountPaid: null,
    paymentMethod: null,
    songName: null,
  };
  const dances: Dance[] = [
    { ...base, id: "d1", name: "Midnight Bloom", dancerIds: ["p1"], progress: "Cleaning", dueDate: "2027-03-14", notes: fromPlain("Clean the turn sequence in the second chorus."), songTitle: "Midnight Bloom", costume: fromPlain("Navy velvet, ordered"), contract: "Signed", contractDate: "2026-09-12", payment: "Partial paid", amountPaid: 150, paymentMethod: "Venmo" },
    { ...base, id: "d2", name: "Paper Hearts", dancerIds: ["p2", "p3"], progress: "In choreography", dueDate: "2027-04-02", notes: fromPlain("Finish the ending lift.") },
    { ...base, id: "d3", name: "Golden Hour", dancerIds: ["p4", "p5", "p6", "p7", "p1", "p3"], progress: "Scheduled", dueDate: null, notes: fromPlain("") },
    { ...base, id: "d4", name: "Echoes", dancerIds: ["p4", "p5", "p6"], progress: "Done", dueDate: "2027-02-20", notes: fromPlain("Ready for competition.") },
    { ...base, id: "d5", name: "Small Town Lights", dancerIds: ["p7"], progress: "Waiting", dueDate: "2027-05-09", notes: fromPlain("Waiting on final song edit."), costume: fromPlain("TBD"), contract: "Sent", payment: "Unpaid" },
    { ...base, id: "d6", name: "Wildflower", dancerIds: ["p8", "p9", "p10", "p11"], progress: "Cleaning", dueDate: "2027-03-28", notes: fromPlain("Spacing for the opening formation.") },
  ];
  const classes: ClassItem[] = [
    { id: "k1", name: "Jazz 2" },
    { id: "k2", name: "Teen contemporary" },
    { id: "k3", name: "Mini hip hop" },
  ];
  // Dated in the weeks around the demo, so the newest ones read as recent.
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
  const combo = { songName: null, songTitle: "", notes: "" };
  const combos: Combo[] = [
    { ...combo, id: "m1", classId: "k1", name: "Chaine turns into kick ball change", date: daysAgo(2), songTitle: "Levitating, Dua Lipa", notes: "Spot the back wall. Counts 5 to 8 are the tricky part." },
    { ...combo, id: "m2", classId: "k1", name: "Leaps across the floor", date: daysAgo(9) },
    { ...combo, id: "m3", classId: "k2", name: "Floor roll and recover", date: daysAgo(1), songTitle: "Ocean Eyes, Billie Eilish", notes: "Use the breath on the recover. Slow version first." },
    { ...combo, id: "m4", classId: "k2", name: "Tilt into attitude turn", date: daysAgo(8), songTitle: "Lovely, Billie Eilish" },
    { ...combo, id: "m5", classId: "k2", name: "Contract and release phrase", date: daysAgo(15) },
    { ...combo, id: "m6", classId: "k3", name: "Bounce and freeze", date: daysAgo(0), songTitle: "Happy, Pharrell Williams" },
    { ...combo, id: "m7", classId: "k3", name: "Animal walks warm up", date: daysAgo(7) },
  ];
  return {
    dances, dancers, choreographers, combos, classes,
    settings: { ...DEFAULT_SETTINGS },
    calendar: { kind: "sample" },
    songs: new Map(),
    nextId: 100,
  };
}

// Each demo visitor gets their own copy of the sample data, kept in memory on the server,
// so nobody sees anyone else's edits. Copies reset whenever the server restarts.
const MAX_DEMOS = 200;
const g = globalThis as unknown as { __choreoDemos?: Map<string, DemoState> };
const demos: Map<string, DemoState> = (g.__choreoDemos ??= new Map<string, DemoState>());

function stateFor(demoId: string) {
  let state = demos.get(demoId);
  if (!state) {
    if (demos.size >= MAX_DEMOS) demos.delete(demos.keys().next().value!);
    state = seed();
    demos.set(demoId, state);
  }
  // Demo copies made before combos existed pick up the sample combos too.
  if (!state.combos) {
    const fresh = seed();
    Object.assign(state, { combos: fresh.combos, classes: fresh.classes, settings: fresh.settings });
  }
  if (state.calendar === undefined) state.calendar = { kind: "sample" };
  state.settings = { ...DEFAULT_SETTINGS, ...state.settings };
  return state;
}

function find<T extends { id: string }>(list: T[], id: string): T {
  const item = list.find((x) => x.id === id);
  if (!item) throw new Error("Not found");
  return item;
}

export function createDemoStore(demoId: string): Store {
  const state = stateFor(demoId);
  const newId = (prefix: string) => `${prefix}${state.nextId++}`;
  // Songs belong to a dance or a combo.
  const withSong = (id: string): { songName: string | null } =>
    state.dances.find((d) => d.id === id) ?? find(state.combos, id);

  return {
    mode: "demo",

    async load() {
      const { settings } = state;
      return {
        settings: { ...settings },
        dances: settings.dances ? structuredClone(state.dances) : [],
        dancers: settings.dances ? structuredClone(state.dancers) : [],
        choreographers: settings.dances ? structuredClone(state.choreographers) : [],
        combos: settings.combos ? structuredClone(state.combos) : [],
        classes: settings.combos ? structuredClone(state.classes) : [],
      };
    },

    async saveSettings(settings) {
      state.settings = { ...settings };
      return settings;
    },

    async createCombo(input) {
      const combo: Combo = { ...input, id: newId("m"), songName: null };
      state.combos.push(combo);
      return combo;
    },
    async updateCombo(id, input) {
      const combo = find(state.combos, id);
      Object.assign(combo, input);
      return combo;
    },
    async deleteCombo(id) {
      state.combos = state.combos.filter((c) => c.id !== id);
      state.songs.delete(id);
    },

    async createClass(input) {
      const item: ClassItem = { ...input, id: newId("k") };
      state.classes.push(item);
      return item;
    },
    async updateClass(id, input) {
      const item = find(state.classes, id);
      Object.assign(item, input);
      return item;
    },
    async deleteClass(id) {
      state.classes = state.classes.filter((c) => c.id !== id);
      for (const combo of state.combos) if (combo.classId === id) combo.classId = null;
    },

    async createDance(input) {
      const dance: Dance = { ...input, id: newId("d"), songName: null };
      state.dances.push(dance);
      return dance;
    },
    async updateDance(id, input) {
      const dance = find(state.dances, id);
      Object.assign(dance, input);
      return dance;
    },
    async deleteDance(id) {
      state.dances = state.dances.filter((d) => d.id !== id);
      state.songs.delete(id);
    },

    async createDancer(input) {
      const dancer: Dancer = { ...input, id: newId("p") };
      state.dancers.push(dancer);
      return dancer;
    },
    async updateDancer(id, input) {
      const dancer = find(state.dancers, id);
      Object.assign(dancer, input);
      return dancer;
    },
    async deleteDancer(id) {
      state.dancers = state.dancers.filter((d) => d.id !== id);
      for (const dance of state.dances) dance.dancerIds = dance.dancerIds.filter((x) => x !== id);
    },

    async createChoreographer(input) {
      const choreographer: Choreographer = { ...input, id: newId("c") };
      state.choreographers.push(choreographer);
      return choreographer;
    },
    async updateChoreographer(id, input) {
      const choreographer = find(state.choreographers, id);
      Object.assign(choreographer, input);
      return choreographer;
    },
    async deleteChoreographer(id) {
      state.choreographers = state.choreographers.filter((c) => c.id !== id);
      for (const dance of state.dances) if (dance.choreographerId === id) dance.choreographerId = null;
    },

    async songSource(danceId) {
      const song = state.songs.get(danceId);
      if (!song) return null;
      return { url: `/api/dances/${danceId}/song?raw=1&t=${Date.now()}`, name: song.name };
    },
    async uploadSong(danceId, file) {
      if (file.size > DEMO_SONG_LIMIT) throw new Error("Demo songs can be up to 4 MB");
      const owner = withSong(danceId);
      state.songs.set(danceId, { name: file.name, type: file.type || "audio/mpeg", data: await file.arrayBuffer() });
      owner.songName = file.name;
    },
    async linkSong() {
      throw new Error("Demo songs are uploaded directly");
    },
    async removeSong(danceId) {
      state.songs.delete(danceId);
      withSong(danceId).songName = null;
    },
  };
}

export function demoSongBytes(demoId: string, danceId: string) {
  return demos.get(demoId)?.songs.get(danceId) ?? null;
}

/** The demo's calendar connection: the sample studio schedule, a real link, or none. */
export function demoCalendar(demoId: string) {
  return stateFor(demoId).calendar;
}

export function setDemoCalendar(demoId: string, calendar: DemoState["calendar"]) {
  stateFor(demoId).calendar = calendar;
}
