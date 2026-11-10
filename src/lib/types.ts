import type { RichText } from "./richtext";

export const PROGRESS = ["Scheduled", "In choreography", "Cleaning", "Done", "Waiting"] as const;
export type Progress = (typeof PROGRESS)[number];

export const CONTRACT = ["Sent", "Signed"] as const;
export type Contract = (typeof CONTRACT)[number];

export const PAYMENT = ["Unpaid", "Partial paid", "Paid"] as const;
export type Payment = (typeof PAYMENT)[number];

export const PAYMENT_METHOD = ["Venmo", "Cash", "Check", "Zelle", "Card"] as const;
export type PaymentMethod = (typeof PAYMENT_METHOD)[number];

export type DanceType = "Solo" | "Duo" | "Trio" | "Group";

export interface Dance {
  id: string;
  name: string;
  choreographerId: string | null;
  dancerIds: string[];
  progress: Progress;
  dueDate: string | null;
  notes: RichText;
  songTitle: string;
  costume: RichText;
  contract: Contract | null;
  contractDate: string | null;
  payment: Payment | null;
  amountPaid: number | null;
  paymentMethod: PaymentMethod | null;
  songName: string | null;
}

export type DanceInput = Omit<Dance, "id" | "songName">;

export interface Dancer {
  id: string;
  name: string;
  birthdate: string | null;
  /** Set by hand when the birthdate isn't known. Ignored when there is a birthdate. */
  age: number | null;
}

export type DancerInput = Omit<Dancer, "id">;

export interface Choreographer {
  id: string;
  name: string;
}

export type ChoreographerInput = Omit<Choreographer, "id">;

/** A short combo taught in a class: a name, a date, an optional song and notes. */
export interface Combo {
  id: string;
  name: string;
  date: string | null;
  classId: string | null;
  songTitle: string;
  notes: string;
  songName: string | null;
}

export type ComboInput = Omit<Combo, "id" | "songName">;

export interface ClassItem {
  id: string;
  name: string;
}

export type ClassInput = Omit<ClassItem, "id">;

/** Which sections someone uses. At least one stays on. */
export interface Settings {
  dances: boolean;
  combos: boolean;
  /** Show tempoh due dates next to calendar events on Home. */
  calendarDue: boolean;
}

export const DEFAULT_SETTINGS: Settings = { dances: true, combos: true, calendarDue: true };

export interface AppData {
  mode: "notion" | "demo";
  who: { name: string | null; workspace: string | null };
  settings: Settings;
  dances: Dance[];
  dancers: Dancer[];
  choreographers: Choreographer[];
  combos: Combo[];
  classes: ClassItem[];
}
