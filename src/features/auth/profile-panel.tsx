"use client";

import { useState, useEffect } from "react";
import { useProfile } from "./use-profile";
import { usePrefsStore } from "@/stores/prefs.store";
import { Field, TextInput } from "@/features/widgets/core/widget-settings";
import { cn } from "@/lib/utils/cn";

// Common IANA timezones — short list. User can also type any IANA name.
const TIMEZONE_HINTS = [
  "America/Santo_Domingo",
  "America/New_York",
  "America/Los_Angeles",
  "America/Mexico_City",
  "Europe/Madrid",
  "Europe/London",
  "Asia/Tokyo",
];

const LOCALE_HINTS = ["en-US", "es-DO", "es-ES", "es-MX", "pt-BR", "fr-FR"];

export function ProfilePanel() {
  const { profile, update } = useProfile();
  const locale = usePrefsStore((s) => s.locale);
  const setLocale = usePrefsStore((s) => s.setLocale);
  const timezone = usePrefsStore((s) => s.timezone);
  const setTimezone = usePrefsStore((s) => s.setTimezone);

  // Local form state — debounce push to avoid 1 request per keystroke
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile?.display_name]);

  // Push display_name when it stabilizes
  useEffect(() => {
    if (!profile || displayName === (profile.display_name ?? "")) return;
    const id = setTimeout(() => {
      void update({ display_name: displayName.trim() || null });
    }, 600);
    return () => clearTimeout(id);
  }, [displayName, profile, update]);

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-3 px-3 py-2.5">
      <Field label="Display name">
        <TextInput
          value={displayName}
          placeholder="Your name"
          onChange={setDisplayName}
        />
      </Field>

      <Field label="Locale" hint="BCP-47 tag for dates and numbers.">
        <input
          type="text"
          value={locale ?? ""}
          onChange={(e) => setLocale(e.target.value.trim() || null)}
          placeholder="en-US"
          list="locale-hints"
          className={cn(
            "w-full rounded-[var(--radius-sm)]",
            "border border-[var(--color-border)] bg-[var(--color-bg-base)]",
            "px-2.5 py-1.5 text-[12.5px] text-[var(--color-text-hi)] outline-none",
            "placeholder:text-[var(--color-text-lo)]",
            "focus:border-[var(--color-accent)]",
          )}
        />
        <datalist id="locale-hints">
          {LOCALE_HINTS.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </Field>

      <Field label="Timezone" hint="Used by clock and timestamps when set.">
        <input
          type="text"
          value={timezone ?? ""}
          onChange={(e) => setTimezone(e.target.value.trim() || null)}
          placeholder="America/Santo_Domingo"
          list="tz-hints"
          className={cn(
            "w-full rounded-[var(--radius-sm)]",
            "border border-[var(--color-border)] bg-[var(--color-bg-base)]",
            "px-2.5 py-1.5 text-[12.5px] text-[var(--color-text-hi)] outline-none",
            "placeholder:text-[var(--color-text-lo)]",
            "focus:border-[var(--color-accent)]",
          )}
        />
        <datalist id="tz-hints">
          {TIMEZONE_HINTS.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </Field>
    </div>
  );
}
