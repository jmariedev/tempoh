import type { DanceType, Dancer, Progress } from "./types";

export function ageFrom(birthdate: string | null, today = new Date()): number | null {
  if (!birthdate) return null;
  const [y, m, d] = birthdate.slice(0, 10).split("-").map(Number);
  let age = today.getFullYear() - y;
  const beforeBirthday =
    today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

/** A dancer's age from their birthdate, or the age set by hand when there's no birthdate. */
export function dancerAge(dancer: Pick<Dancer, "birthdate" | "age">): number | null {
  return dancer.birthdate ? ageFrom(dancer.birthdate) : dancer.age;
}

/** A dance with no dancers yet counts as a group. */
export function danceType(dancerCount: number): DanceType {
  if (dancerCount === 1) return "Solo";
  if (dancerCount === 2) return "Duo";
  if (dancerCount === 3) return "Trio";
  return "Group";
}

export function averageAge(dancers: Dancer[]): number | null {
  const ages = dancers.map(dancerAge).filter((a): a is number => a !== null);
  if (ages.length === 0) return null;
  return Math.round((ages.reduce((sum, a) => sum + a, 0) / ages.length) * 10) / 10;
}

export function formatDate(iso: string | null, withYear = false): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear && { year: "numeric" }),
  });
}

export const STAGE_COLORS: Record<Progress, { bg: string; fg: string }> = {
  Scheduled: { bg: "#D5D9E0", fg: "#4A505C" },
  "In choreography": { bg: "#9CC8F2", fg: "#2D5F8F" },
  Cleaning: { bg: "#F4A48C", fg: "#A4432A" },
  Done: { bg: "#8FD3C7", fg: "#22706A" },
  Waiting: { bg: "#F5CF7A", fg: "#8A6410" },
};

/** How far along each stage is, out of four. Waiting is paused, so it fills none. */
export const STAGE_STEP: Record<Progress, number> = {
  Scheduled: 1,
  "In choreography": 2,
  Cleaning: 3,
  Done: 4,
  Waiting: 0,
};

/** Today's date in the person's own time zone, as YYYY-MM-DD. */
export function todayISO(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Splits a date for a calendar tile: "NOV" and "4". */
export function dateTile(iso: string | null) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return { month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(), day: String(d) };
}
