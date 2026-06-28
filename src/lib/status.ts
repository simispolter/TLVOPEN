export type SpaceStatus =
  | "verified_open"
  | "official_unverified"
  | "unclear"
  | "reported_blocked"
  | "closed";

export type StatusMeta = {
  label: string;
  description: string;
  markerColor: string;
  badgeClassName: string;
  icon: "CircleCheck" | "FileSearch" | "CircleHelp" | "OctagonAlert" | "Lock";
};

export const statusMeta: Record<SpaceStatus, StatusMeta> = {
  verified_open: {
    label: "פתוח ומאומת",
    description:
      "המקום אומת כמקום שניתן להיכנס אליו או להשתמש בו בפועל.",
    markerColor: "#18A558",
    badgeClassName: "bg-open/12 text-open ring-open/25",
    icon: "CircleCheck",
  },
  official_unverified: {
    label: "מקור רשמי, טרם אומת",
    description: "המקום מופיע במקור רשמי, אך טרם נבדק בשטח.",
    markerColor: "#F5B700",
    badgeClassName: "bg-official/18 text-ink ring-official/35",
    icon: "FileSearch",
  },
  unclear: {
    label: "לא ברור",
    description:
      "קיימת אי בהירות לגבי הכניסה, השימוש או היקף הזכות הציבורית.",
    markerColor: "#F97316",
    badgeClassName: "bg-unclear/12 text-unclear ring-unclear/25",
    icon: "CircleHelp",
  },
  reported_blocked: {
    label: "דווח כחסום",
    description:
      "התקבל דיווח שלפיו הגישה למקום חסומה או מוגבלת.",
    markerColor: "#DC2626",
    badgeClassName: "bg-blocked/12 text-blocked ring-blocked/25",
    icon: "OctagonAlert",
  },
  closed: {
    label: "סגור",
    description: "המקום מסומן כסגור או לא נגיש לציבור.",
    markerColor: "#64748B",
    badgeClassName: "bg-concrete/12 text-concrete ring-concrete/25",
    icon: "Lock",
  },
};

export const mapColorByStatus = Object.fromEntries(
  Object.entries(statusMeta).map(([status, meta]) => [status, meta.markerColor]),
) as Record<SpaceStatus, string>;
