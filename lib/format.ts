const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "just now" / "12m ago" / "3h ago" / "2d ago". */
export function relativeTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;

  const elapsed = Date.now() - then;
  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return `${Math.round(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.round(elapsed / HOUR)}h ago`;
  if (elapsed < 7 * DAY) return `${Math.round(elapsed / DAY)}d ago`;
  return formatDate(iso);
}

export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function plural(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/** Strip school names Nutrient glues onto a home-base city. */
export function homeCity(value: string | null | undefined): string {
  if (!value) return "";
  const text = value.replace(/\s+/g, " ").trim();
  if (!/\b(university|college|institute|polytechnic|academy)\b/i.test(text)) return text;
  const parts = text.split(",").map((part) => part.trim()).filter(Boolean);
  const region = parts.length >= 2 && /^([A-Z]{2}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$/.test(parts.at(-1) ?? "")
    ? parts.at(-1)!
    : null;
  const head = region ? parts.slice(0, -1) : parts;
  const cityParts = head.filter((part) => !/\b(university|college|institute|polytechnic|academy)\b/i.test(part));
  if (cityParts.length) {
    const city = cityParts.join(", ");
    return region ? `${city}, ${region}` : city;
  }
  const peeled = head
    .join(" ")
    .replace(
      /^(?:[A-Z][a-z]+\s+)*(?:University|College|Institute|Polytechnic|Academy)(?:\s+of\s+[A-Z][a-z]+)?\s*/i,
      "",
    )
    .replace(/^[,\s]+|[,\s]+$/g, "");
  if (peeled && !/\b(university|college|institute|polytechnic|academy)\b/i.test(peeled)) {
    return region ? `${peeled}, ${region}` : peeled;
  }
  return text;
}
