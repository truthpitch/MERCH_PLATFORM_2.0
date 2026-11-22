"use client";

import { useEffect, useState } from "react";
import { inputClass } from "./styles";

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/**
 * Date + time picker in the admin's own time zone. It sends the moment as an exact
 * UTC time (hidden field), so the countdown ends at the same instant for every visitor.
 */
export function DateTimeField({
  id,
  name,
  defaultIso,
  help = "Leave empty for no countdown. The bar hides itself when the time is up.",
}: {
  id: string;
  name: string;
  defaultIso: string | null;
  help?: string;
}) {
  const [local, setLocal] = useState("");
  // Filled in after mounting, because the time zone is only known in the browser.
  useEffect(() => {
    if (defaultIso) setLocal(toLocalInput(new Date(defaultIso)));
  }, [defaultIso]);

  const iso = local ? new Date(local).toISOString() : "";
  const zone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";

  return (
    <div>
      <div className="flex gap-2">
        <input id={id} type="datetime-local" value={local} onChange={(e) => setLocal(e.target.value)} className={inputClass} />
        {local && (
          <button type="button" onClick={() => setLocal("")} className="shrink-0 border border-neutral-300 px-3 text-sm text-black hover:border-black">
            Clear
          </button>
        )}
      </div>
      <input type="hidden" name={name} value={iso} />
      <p suppressHydrationWarning className="mt-1 text-xs text-neutral-500">
        Your time zone{zone ? ` (${zone})` : ""}. {help}
      </p>
    </div>
  );
}
