"use client";

import { useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  cancelled: "Sign-in was cancelled. You can try again any time.",
  state: "That sign-in link expired. Try signing in again.",
  "no-databases":
    "tempoh couldn't find its Dances, Dancers and Choreographers databases. Sign in again and choose to copy the tempoh template, or share your existing Choreo HQ page.",
  notion: "Notion didn't finish the sign-in. Try again in a minute.",
  setup: "Sign in with Notion isn't set up on this site yet. You can still try the demo.",
};

export default function WelcomeError() {
  const error = useSearchParams().get("error");
  if (!error) return null;
  return <p className="error">{MESSAGES[error] ?? "Something went wrong. Try again."}</p>;
}
