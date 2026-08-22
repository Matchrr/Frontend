import {
  CalendarDays,
  Crosshair,
  FileText,
  LayoutGrid,
  Send,
  Sprout,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import type { Overview } from "@/lib/types";

export type NavItem = {
  href: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  /** Count shown beside the label. Return 0 or null to hide it. */
  badge?: (overview: Overview | null) => number | null;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/",
        label: "Dashboard",
        hint: "Where you stand today",
        icon: LayoutGrid,
      },
      {
        href: "/profile",
        label: "Profile",
        hint: "Ground your history",
        icon: UserRound,
      },
    ],
  },
  {
    label: "Pipeline",
    items: [
      {
        href: "/jobs",
        label: "Job matches",
        hint: "Ranked live roles",
        icon: Crosshair,
        badge: (overview) => overview?.strong_matches ?? null,
      },
      {
        href: "/dossier",
        label: "Dossier",
        hint: "Tailored materials",
        icon: FileText,
        badge: (overview) => overview?.dossiers_ready ?? null,
      },
      {
        href: "/outreach",
        label: "Outreach",
        hint: "Approved emails",
        icon: Send,
        badge: (overview) => overview?.outreach_sent ?? null,
      },
    ],
  },
  {
    label: "Growth",
    items: [
      {
        href: "/growth",
        label: "Growth plan",
        hint: "Close skill gaps",
        icon: Sprout,
        badge: (overview) => overview?.open_skill_gaps ?? null,
      },
      {
        href: "/networking",
        label: "Networking",
        hint: "Compatible events",
        icon: CalendarDays,
        badge: (overview) => overview?.events_saved ?? null,
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.href === pathname);
}
