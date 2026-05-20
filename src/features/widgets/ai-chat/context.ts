"use client";

import { getDb } from "@/lib/db/dexie";
import { useLayoutStore } from "@/stores/layout.store";
import { formatBytes, formatUptime } from "@/features/widgets/system/use-system";
import type { SystemStats } from "@/app/api/system/route";
import { getValidAccessToken as getSpotifyToken } from "@/features/widgets/spotify/oauth";
import { getValidGoogleToken } from "@/features/auth/google-services";
import { describeWmo, type WeatherConfig } from "@/features/widgets/weather/config";
import type { CryptoConfig, CryptoCurrency } from "@/features/widgets/crypto/config";
import { CURRENCY_SYMBOL } from "@/features/widgets/crypto/config";

/**
 * Dashboard context for APPI.
 *
 * Pulls live data from every connected source so APPI can answer
 * "what's playing", "how many unread mails", "next event", etc. without
 * the user having to look. Every source is best-effort with a short
 * timeout — one slow API never blocks the chat.
 *
 * NEVER fabricate. If a source isn't connected or fails, it goes to
 * "no disponible" and the system prompt tells the model not to guess.
 */

const CAP = { tasks: 40, notes: 25, bookmarks: 40, noteChars: 140, events: 10, mail: 6 } as const;
const SLOW_API_TIMEOUT_MS = 2500;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

// ---------------------------------------------------------------------------
// Sub-collectors. Each returns either a line string or null when the source
// is unavailable. They all swallow their own errors — context building can
// never throw.
// ---------------------------------------------------------------------------

async function fetchSystem(): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch("/api/system", { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(t);
    if (!res.ok) return null;
    const s = (await res.json()) as SystemStats;
    const usedMem = s.memory.systemTotal - s.memory.systemFree;
    return [
      `uptime proceso ${formatUptime(s.uptime)}`,
      `RAM usada ${formatBytes(usedMem)} de ${formatBytes(s.memory.systemTotal)}`,
      `carga ${s.cpu.loadAvg.map((n) => n.toFixed(2)).join(" / ")} (${s.cpu.count} CPU)`,
      `host ${s.host}`,
    ].join(" · ");
  } catch {
    return null;
  }
}

interface SpotifyApiResponse {
  is_playing: boolean;
  progress_ms: number;
  item: {
    name: string;
    duration_ms: number;
    artists: Array<{ name: string }>;
    album: { name: string };
  } | null;
}

async function fetchSpotify(): Promise<string | null> {
  try {
    const token = await getSpotifyToken();
    if (!token) return null;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), SLOW_API_TIMEOUT_MS);
    const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    clearTimeout(t);

    if (res.status === 204) return "no hay reproducción activa";
    if (!res.ok) return null;
    const text = await res.text();
    if (!text) return "no hay reproducción activa";
    const data = JSON.parse(text) as SpotifyApiResponse;
    if (!data.item) return "no hay reproducción activa";

    const fmt = (ms: number): string => {
      const s = Math.floor(ms / 1000);
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    };
    const state = data.is_playing ? "sonando" : "pausada";
    return `"${data.item.name}" — ${data.item.artists.map((a) => a.name).join(", ")} (${data.item.album.name}) · ${state} · ${fmt(data.progress_ms)} / ${fmt(data.item.duration_ms)}`;
  } catch {
    return null;
  }
}

interface GmailListResponse {
  messages?: Array<{ id: string }>;
  resultSizeEstimate?: number;
}
interface GmailMsgMetaResponse {
  payload: { headers: Array<{ name: string; value: string }> };
}

async function fetchGmail(token: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), SLOW_API_TIMEOUT_MS);
    // Unread in primary inbox — the same query the Gmail widget uses by default.
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent("is:unread in:inbox")}&maxResults=${CAP.mail}`,
      { signal: ctrl.signal, headers: { Authorization: `Bearer ${token}` } },
    );
    clearTimeout(t);
    if (!listRes.ok) return null;
    const list = (await listRes.json()) as GmailListResponse;
    const count = list.resultSizeEstimate ?? list.messages?.length ?? 0;
    if (count === 0) return "bandeja al día — 0 correos sin leer";

    const ids = (list.messages ?? []).slice(0, CAP.mail).map((m) => m.id);
    const previews = await Promise.all(
      ids.map(async (id): Promise<string | null> => {
        try {
          const r = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (!r.ok) return null;
          const m = (await r.json()) as GmailMsgMetaResponse;
          const from = m.payload.headers.find((h) => h.name === "From")?.value ?? "";
          const subj = m.payload.headers.find((h) => h.name === "Subject")?.value ?? "(sin asunto)";
          const fromClean =
            /^(.*?)\s*<.*>$/.exec(from)?.[1]?.replace(/^"|"$/g, "").trim() ??
            from.split("@")[0] ??
            from;
          return `${fromClean}: ${subj}`;
        } catch {
          return null;
        }
      }),
    );

    const lines = previews.filter((x): x is string => !!x);
    const out = [`${count} correos sin leer`];
    for (const l of lines) out.push(`  - ${l}`);
    return out.join("\n");
  } catch {
    return null;
  }
}

interface GCalApiResponse {
  items?: Array<{
    id: string;
    summary?: string;
    location?: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
  }>;
}

async function fetchCalendar(token: string): Promise<string | null> {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 7);
    horizon.setHours(23, 59, 59, 999);

    const params = new URLSearchParams({
      timeMin: start,
      timeMax: horizon.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: String(CAP.events),
    });

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), SLOW_API_TIMEOUT_MS);
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      { signal: ctrl.signal, headers: { Authorization: `Bearer ${token}` } },
    );
    clearTimeout(t);
    if (!res.ok) return null;
    const data = (await res.json()) as GCalApiResponse;
    const items = data.items ?? [];
    if (items.length === 0) return "sin eventos en los próximos 7 días";

    const fmt = new Intl.DateTimeFormat("es-DO", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    const lines = [`${items.length} eventos en los próximos 7 días:`];
    for (const e of items) {
      const allDay = !e.start.dateTime;
      const when = allDay
        ? new Date(`${e.start.date}T00:00:00`).toLocaleDateString("es-DO", {
            weekday: "short",
            day: "2-digit",
            month: "short",
          }) + " (todo el día)"
        : fmt.format(new Date(e.start.dateTime!));
      const loc = e.location ? ` @ ${e.location}` : "";
      lines.push(`  - ${when} — ${e.summary ?? "(sin título)"}${loc}`);
    }
    return lines.join("\n");
  } catch {
    return null;
  }
}

// Weather collector — one entry per active weather widget so APPI knows the
// units and city the user actually cares about. Open-Meteo is keyless.
async function fetchWeather(configs: WeatherConfig[]): Promise<string[]> {
  if (configs.length === 0) return [];
  const out: string[] = [];
  await Promise.all(
    configs.map(async (cfg) => {
      try {
        const params = new URLSearchParams({
          latitude: String(cfg.latitude),
          longitude: String(cfg.longitude),
          current: "temperature_2m,weathercode,windspeed_10m,relativehumidity_2m",
          timezone: "auto",
          temperature_unit: cfg.units === "imperial" ? "fahrenheit" : "celsius",
          windspeed_unit: cfg.units === "imperial" ? "mph" : "kmh",
        });
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), SLOW_API_TIMEOUT_MS);
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
          signal: ctrl.signal,
        });
        clearTimeout(t);
        if (!res.ok) return;
        const data = (await res.json()) as {
          current?: {
            temperature_2m: number;
            weathercode: number;
            windspeed_10m: number;
            relativehumidity_2m: number;
          };
        };
        if (!data.current) return;
        const [, label] = describeWmo(data.current.weathercode);
        const tUnit = cfg.units === "imperial" ? "°F" : "°C";
        const wUnit = cfg.units === "imperial" ? "mph" : "km/h";
        out.push(
          `${cfg.city}: ${Math.round(data.current.temperature_2m)}${tUnit}, ${label.toLowerCase()}, humedad ${data.current.relativehumidity_2m}%, viento ${Math.round(data.current.windspeed_10m)} ${wUnit}`,
        );
      } catch {
        /* skip this location */
      }
    }),
  );
  return out;
}

async function fetchCrypto(configs: CryptoConfig[]): Promise<string | null> {
  if (configs.length === 0) return null;
  // Merge all crypto widgets into one CoinGecko call per currency.
  const byCurrency = new Map<CryptoCurrency, Set<string>>();
  for (const c of configs) {
    const set = byCurrency.get(c.currency) ?? new Set<string>();
    for (const coin of c.coins) set.add(coin.toLowerCase());
    byCurrency.set(c.currency, set);
  }

  const sections: string[] = [];
  await Promise.all(
    [...byCurrency.entries()].map(async ([currency, coins]) => {
      try {
        const params = new URLSearchParams({
          ids: [...coins].join(","),
          vs_currencies: currency,
          include_24hr_change: "true",
        });
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), SLOW_API_TIMEOUT_MS);
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?${params.toString()}`,
          { signal: ctrl.signal },
        );
        clearTimeout(t);
        if (!res.ok) return;
        const data = (await res.json()) as Record<
          string,
          Record<string, number | undefined>
        >;
        const sym = CURRENCY_SYMBOL[currency];
        const lines: string[] = [];
        for (const coin of coins) {
          const entry = data[coin];
          if (!entry) continue;
          const price = entry[currency];
          const change = entry[`${currency}_24h_change`];
          if (price === undefined) continue;
          const arrow = (change ?? 0) >= 0 ? "↑" : "↓";
          lines.push(
            `${coin}: ${sym}${price.toLocaleString("en-US", { maximumFractionDigits: 6 })} (${arrow}${Math.abs(change ?? 0).toFixed(2)}% 24h)`,
          );
        }
        if (lines.length > 0) sections.push(lines.join(" · "));
      } catch {
        /* skip */
      }
    }),
  );

  return sections.length > 0 ? sections.join(" || ") : null;
}

// ---------------------------------------------------------------------------
// Main orchestrator.
// ---------------------------------------------------------------------------

export async function buildDashboardContext(): Promise<string> {
  const db = getDb();
  const lines: string[] = [];

  const now = new Date();
  lines.push(
    `FECHA/HORA: ${now.toLocaleString("es-DO", { dateStyle: "full", timeStyle: "short" })}`,
  );

  // Local-first sources (Dexie — instant)
  if (db) {
    const [tasks, notes, bookmarks] = await Promise.all([
      db.tasks.toArray(),
      db.notes.toArray(),
      db.bookmarks.toArray(),
    ]);

    const pending = tasks.filter((t) => !t.completed);
    const done = tasks.filter((t) => t.completed);
    if (tasks.length > 0) {
      const shown = pending.slice(0, CAP.tasks);
      lines.push(`TAREAS (${pending.length} pendientes, ${done.length} completadas):`);
      for (const t of shown) lines.push(`- [ ] ${t.content}`);
      if (pending.length > shown.length)
        lines.push(`- (+${pending.length - shown.length} pendientes más)`);
    } else {
      lines.push("TAREAS: ninguna");
    }

    if (notes.length > 0) {
      lines.push(`NOTAS (${notes.length}):`);
      for (const n of notes.slice(0, CAP.notes)) {
        const txt = n.content.replace(/\s+/g, " ").trim().slice(0, CAP.noteChars);
        lines.push(`- ${txt || "(vacía)"}`);
      }
      if (notes.length > CAP.notes) lines.push(`- (+${notes.length - CAP.notes} notas más)`);
    } else {
      lines.push("NOTAS: ninguna");
    }

    if (bookmarks.length > 0) {
      lines.push(`MARCADORES (${bookmarks.length}):`);
      for (const b of bookmarks.slice(0, CAP.bookmarks)) {
        lines.push(`- ${b.label} — ${b.url}`);
      }
      if (bookmarks.length > CAP.bookmarks)
        lines.push(`- (+${bookmarks.length - CAP.bookmarks} más)`);
    } else {
      lines.push("MARCADORES: ninguno");
    }
  }

  // Inspect the layout store for which integrations the user has visible.
  // We use config from those widgets so weather/crypto reflect the user's
  // settings (city, units, picked coins) instead of hardcoded defaults.
  let weatherConfigs: WeatherConfig[] = [];
  let cryptoConfigs: CryptoConfig[] = [];
  try {
    const { order, instances } = useLayoutStore.getState();
    const counts = new Map<string, number>();
    for (const id of order) {
      const inst = instances[id];
      if (!inst) continue;
      counts.set(inst.type, (counts.get(inst.type) ?? 0) + 1);
      if (inst.type === "weather") {
        weatherConfigs.push(inst.config as unknown as WeatherConfig);
      } else if (inst.type === "crypto") {
        cryptoConfigs.push(inst.config as unknown as CryptoConfig);
      }
    }
    if (counts.size > 0) {
      const list = Array.from(counts.entries())
        .map(([t, c]) => (c > 1 ? `${t} x${c}` : t))
        .join(", ");
      lines.push(`WIDGETS ACTIVOS: ${list}`);
    }
  } catch {
    /* layout store not ready — skip */
  }

  // Network-bound sources run in parallel with a tight timeout so the whole
  // context never blocks the chat for more than ~2.5s.
  const googleToken = await getValidGoogleToken().catch(() => null);

  const [spotify, gmail, calendar, weather, crypto, system] = await Promise.all([
    withTimeout(fetchSpotify(), SLOW_API_TIMEOUT_MS + 500).catch(() => null),
    googleToken
      ? withTimeout(fetchGmail(googleToken), SLOW_API_TIMEOUT_MS + 500).catch(() => null)
      : Promise.resolve(null),
    googleToken
      ? withTimeout(fetchCalendar(googleToken), SLOW_API_TIMEOUT_MS + 500).catch(() => null)
      : Promise.resolve(null),
    withTimeout(fetchWeather(weatherConfigs), SLOW_API_TIMEOUT_MS + 500).catch(() => []),
    withTimeout(fetchCrypto(cryptoConfigs), SLOW_API_TIMEOUT_MS + 500).catch(() => null),
    fetchSystem(),
  ]);

  lines.push(`SPOTIFY: ${spotify ?? "no conectado"}`);
  lines.push(`GMAIL: ${gmail ?? (googleToken ? "consulta falló" : "no conectado")}`);
  lines.push(`CALENDARIO: ${calendar ?? (googleToken ? "consulta falló" : "no conectado")}`);

  if (weather.length > 0) {
    lines.push("CLIMA:");
    for (const w of weather) lines.push(`  - ${w}`);
  } else if (weatherConfigs.length > 0) {
    lines.push("CLIMA: consulta falló");
  } else {
    lines.push("CLIMA: no hay widget de clima activo");
  }

  if (crypto) {
    lines.push(`CRIPTO: ${crypto}`);
  } else if (cryptoConfigs.length > 0) {
    lines.push("CRIPTO: consulta falló");
  } else {
    lines.push("CRIPTO: no hay widget de cripto activo");
  }

  if (system) lines.push(`SISTEMA: ${system}`);

  return [
    "=== CONTEXTO DEL DASHBOARD (datos reales del usuario, ahora mismo) ===",
    ...lines,
    "=== FIN DEL CONTEXTO ===",
  ].join("\n");
}
