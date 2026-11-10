import {
  CONTRACT,
  PAYMENT,
  PAYMENT_METHOD,
  PROGRESS,
  type ChoreographerInput,
  type ClassInput,
  type ComboInput,
  type Settings,
  type DanceInput,
  type DancerInput,
} from "./types";
import { sanitize } from "./richtext";

type Body = Record<string, unknown>;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const dateOrNull = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null);
const moneyOrNull = (v: unknown) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};
const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): T | null =>
  (allowed as readonly unknown[]).includes(v) ? (v as T) : null;

function requireName(body: Body) {
  const name = str(body.name);
  if (!name) throw new Error("A name is required");
  return name;
}

export function parseDance(body: Body): DanceInput {
  const dancerIds = Array.isArray(body.dancerIds) ? body.dancerIds.filter((x): x is string => typeof x === "string") : [];
  const solo = dancerIds.length === 1;
  return {
    name: requireName(body),
    choreographerId: str(body.choreographerId) || null,
    dancerIds,
    progress: oneOf(body.progress, PROGRESS) ?? "Scheduled",
    dueDate: dateOrNull(body.dueDate),
    notes: sanitize(body.notes),
    songTitle: str(body.songTitle),
    costume: sanitize(body.costume),
    // Contract and payment details only apply to solos.
    contract: solo ? oneOf(body.contract, CONTRACT) : null,
    contractDate: solo ? dateOrNull(body.contractDate) : null,
    payment: solo ? oneOf(body.payment, PAYMENT) : null,
    amountPaid: solo ? moneyOrNull(body.amountPaid) : null,
    paymentMethod: solo ? oneOf(body.paymentMethod, PAYMENT_METHOD) : null,
  };
}

export function parseDancer(body: Body): DancerInput {
  const birthdate = dateOrNull(body.birthdate);
  const age = moneyOrNull(body.age);
  // A birthdate wins; otherwise keep a whole-number age between 1 and 99.
  return {
    name: requireName(body),
    birthdate,
    age: birthdate || age === null ? null : Math.min(99, Math.max(1, Math.round(age))),
  };
}

export function parseChoreographer(body: Body): ChoreographerInput {
  return { name: requireName(body) };
}

export function parseCombo(body: Body): ComboInput {
  return {
    name: requireName(body),
    date: dateOrNull(body.date),
    classId: str(body.classId) || null,
    songTitle: str(body.songTitle),
    notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 4000) : "",
  };
}

export function parseClass(body: Body): ClassInput {
  return { name: requireName(body) };
}

export function parseSettings(body: Body): Settings {
  const settings = { dances: body.dances !== false, combos: body.combos !== false, calendarDue: body.calendarDue !== false };
  if (!settings.dances && !settings.combos) throw new Error("Keep at least one section on");
  return settings;
}
