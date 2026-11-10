import type {
  AppData,
  Choreographer,
  ChoreographerInput,
  ClassInput,
  ClassItem,
  Combo,
  ComboInput,
  Settings,
  Dance,
  DanceInput,
  Dancer,
  DancerInput,
} from "../types";

export interface SongSource {
  url: string;
  name: string;
}

export interface Store {
  mode: AppData["mode"];
  load(): Promise<Omit<AppData, "mode" | "who">>;

  saveSettings(settings: Settings): Promise<Settings>;

  createCombo(input: ComboInput): Promise<Combo>;
  updateCombo(id: string, input: ComboInput): Promise<Combo>;
  deleteCombo(id: string): Promise<void>;

  createClass(input: ClassInput): Promise<ClassItem>;
  updateClass(id: string, input: ClassInput): Promise<ClassItem>;
  deleteClass(id: string): Promise<void>;

  createDance(input: DanceInput): Promise<Dance>;
  updateDance(id: string, input: DanceInput): Promise<Dance>;
  deleteDance(id: string): Promise<void>;

  createDancer(input: DancerInput): Promise<Dancer>;
  updateDancer(id: string, input: DancerInput): Promise<Dancer>;
  deleteDancer(id: string): Promise<void>;

  createChoreographer(input: ChoreographerInput): Promise<Choreographer>;
  updateChoreographer(id: string, input: ChoreographerInput): Promise<Choreographer>;
  deleteChoreographer(id: string): Promise<void>;

  /** Song methods take a dance or combo id. Returns a playable URL, refreshed on every call. */
  songSource(danceId: string): Promise<SongSource | null>;
  /** Demo only: stores the file itself. */
  uploadSong(danceId: string, file: File): Promise<void>;
  /** Notion only: saves a song already uploaded to Vercel Blob. */
  linkSong(danceId: string, song: SongSource): Promise<void>;
  removeSong(danceId: string): Promise<void>;
}
