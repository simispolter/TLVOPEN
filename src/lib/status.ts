export type VerificationStatus =
  | "candidate_raw"
  | "candidate_likely_public"
  | "verified_public_access"
  | "field_verified_open"
  | "reported_blocked"
  | "excluded";

export type SpaceStatus = VerificationStatus;

export type SpaceConfidence =
  | "raw_candidate_only"
  | "keyword_likely_public"
  | "official_source_public_wording"
  | "manual_curated_source"
  | "field_verified"
  | "reported_issue";

export type StatusMeta = {
  label: string;
  description: string;
  markerColor: string;
  badgeClassName: string;
  icon:
    | "CircleCheck"
    | "FileSearch"
    | "CircleHelp"
    | "OctagonAlert"
    | "Lock"
    | "FlaskConical";
};

export const statusMeta: Record<VerificationStatus, StatusMeta> = {
  candidate_raw: {
    label: "מועמד לבדיקה",
    description:
      "רשומת מקור גולמית. זו אינה הוכחה לכך שהמקום פתוח לציבור.",
    markerColor: "#94A3B8",
    badgeClassName: "bg-concrete/12 text-concrete ring-concrete/25",
    icon: "FlaskConical",
  },
  candidate_likely_public: {
    label: "כנראה פתוח לציבור - דורש אימות",
    description:
      "נמצאה אינדיקציה לשימוש או מעבר ציבורי, אך עדיין נדרש אימות מול מקור רשמי או בדיקת שטח.",
    markerColor: "#F5B700",
    badgeClassName: "bg-official/18 text-ink ring-official/35",
    icon: "FileSearch",
  },
  verified_public_access: {
    label: "פתוח לציבור לפי מקור מאומת",
    description:
      "קיים מקור מאומת שמצביע על זכות ציבורית, מעבר, כניסה או שימוש ציבורי.",
    markerColor: "#2563EB",
    badgeClassName: "bg-mapblue/12 text-mapblue ring-mapblue/25",
    icon: "CircleCheck",
  },
  field_verified_open: {
    label: "נבדק בשטח ונמצא פתוח",
    description: "המקום נבדק בשטח ונמצא פתוח או נגיש לציבור בפועל.",
    markerColor: "#18A558",
    badgeClassName: "bg-open/12 text-open ring-open/25",
    icon: "CircleCheck",
  },
  reported_blocked: {
    label: "דווח כחסום",
    description:
      "התקבל דיווח שלפיו הגישה למקום חסומה או מוגבלת.",
    markerColor: "#DC2626",
    badgeClassName: "bg-blocked/12 text-blocked ring-blocked/25",
    icon: "OctagonAlert",
  },
  excluded: {
    label: "לא רלוונטי לציבור",
    description:
      "הרשומה סווגה כטכנית, תשתיתית או לא רלוונטית למפת גישה ציבורית.",
    markerColor: "#64748B",
    badgeClassName: "bg-concrete/12 text-concrete ring-concrete/25",
    icon: "Lock",
  },
};

export const publicVerificationStatuses: VerificationStatus[] = [
  "verified_public_access",
  "field_verified_open",
  "reported_blocked",
];

export const researchVerificationStatuses: VerificationStatus[] = [
  "candidate_likely_public",
  "candidate_raw",
];

export const mapColorByStatus = Object.fromEntries(
  Object.entries(statusMeta).map(([status, meta]) => [status, meta.markerColor]),
) as Record<VerificationStatus, string>;
