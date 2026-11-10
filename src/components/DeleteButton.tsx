"use client";

import { Spinner } from "./Loading";
import { IconTrash } from "@tabler/icons-react";
import { useState } from "react";

interface Props {
  onDelete: () => Promise<void>;
  /** Icon-only, for tight rows. */
  compact?: boolean;
  label?: string;
}

export default function DeleteButton({ onDelete, compact, label }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!confirming && compact) {
    return (
      <button className="icon-toggle danger" onClick={() => setConfirming(true)} aria-label={`Delete ${label ?? ""}`.trim()}>
        <IconTrash size={15} />
      </button>
    );
  }

  if (!confirming) {
    return (
      <button className="btn danger" onClick={() => setConfirming(true)}>
        <IconTrash size={13} />
        Delete
      </button>
    );
  }

  return (
    <>
      <button
        className="btn danger-solid"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onDelete();
          } finally {
            setBusy(false);
            setConfirming(false);
          }
        }}
      >
        {busy && <Spinner />}
        {busy ? "Deleting" : compact ? "Delete" : "Yes, delete"}
      </button>
      <button className="btn" onClick={() => setConfirming(false)}>
        {compact ? "Keep" : "Keep it"}
      </button>
    </>
  );
}
