import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Diamond,
  ExternalLink,
  Flag,
  Navigation,
  Share2,
} from "lucide-react";
import { SpaceCard } from "@/components/SpaceCard";
import type { Space } from "@/lib/normalizeSpace";
import {
  createNavigationLinks,
  spaceDetailUrl,
  spaceReportUrl,
} from "@/lib/navigationLinks";
import { statusMeta, type SpaceStatus } from "@/lib/status";
import { distanceKm } from "@/lib/spaces";
import { StatusBadge } from "./StatusBadge";

export type FilterKey = "all" | SpaceStatus;

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "הכל" },
  { key: "verified_public_access", label: "מקור מאומת" },
  { key: "field_verified_open", label: "נבדק בשטח" },
  { key: "candidate_likely_public", label: "כנראה ציבורי" },
  { key: "candidate_raw", label: "מועמדים גולמיים" },
  { key: "reported_blocked", label: "דווח כחסום" },
];

type BottomSheetProps = {
  spaces: Space[];
  visibleSpaces: Space[];
  mapCenter: [number, number];
  selectedSpace?: Space;
  activeFilter: FilterKey;
  loading: boolean;
  researchEnabled: boolean;
  onResearchToggle: (enabled: boolean) => void;
  onFilterChange: (filter: FilterKey) => void;
  onSelect: (space: Space) => void;
  onClearSelection: () => void;
  onShare: (space: Space) => void;
};

function confidenceLabel(confidence: Space["confidence"]) {
  const labels: Record<Space["confidence"], string> = {
    raw_candidate_only: "מועמד גולמי בלבד",
    keyword_likely_public: "מילת מפתח למחקר",
    official_source_public_wording: "ניסוח ציבורי במקור רשמי",
    manual_curated_source: "רשומה ידנית עם מקור",
    field_verified: "אומת בשטח",
    reported_issue: "דיווח על בעיה",
  };

  return labels[confidence];
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold text-concrete">{label}</dt>
      <dd className="mt-1 text-sm font-extrabold text-ink">{value}</dd>
    </div>
  );
}

function isResearchCandidate(space: Space) {
  return (
    space.verificationStatus === "candidate_raw" ||
    space.verificationStatus === "candidate_likely_public"
  );
}

export function BottomSheet({
  spaces,
  visibleSpaces,
  mapCenter,
  selectedSpace,
  activeFilter,
  loading,
  researchEnabled,
  onResearchToggle,
  onFilterChange,
  onSelect,
  onClearSelection,
  onShare,
}: BottomSheetProps) {
  const mapReadySpaces = visibleSpaces.filter(
    (space) => space.geometry && space.centroid,
  );
  const rankedSpaces = mapReadySpaces
    .map((space) => ({
      space,
      distance: distanceKm(mapCenter, space.centroid),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 24);

  const navigationLinks = selectedSpace
    ? createNavigationLinks(selectedSpace)
    : undefined;

  return (
    <section className="absolute inset-x-0 bottom-0 z-20 max-h-[72dvh] rounded-t-[28px] border-t border-white/70 bg-background/96 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-sheet backdrop-blur md:bottom-4 md:left-1/2 md:right-auto md:max-h-[calc(100dvh-2rem)] md:w-[460px] md:-translate-x-1/2 md:rounded-[28px] md:border">
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/18" />

      {selectedSpace ? (
        <div className="flex max-h-[62dvh] flex-col gap-4 overflow-y-auto pr-1 md:max-h-[calc(100dvh-5rem)]">
          {isResearchCandidate(selectedSpace) ? (
            <div className="rounded-lg bg-official/20 p-3 text-sm font-extrabold leading-6 text-ink ring-1 ring-official/40">
              רשומה זו היא מועמדת לבדיקה בלבד. היא אינה הוכחה לכך שהמקום פתוח לציבור.
            </div>
          ) : null}

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <StatusBadge status={selectedSpace.status} />
              <h1 className="mt-3 text-xl font-black leading-7 text-ink">
                {selectedSpace.name}
              </h1>
              <p className="mt-1 text-sm font-semibold text-concrete">
                {selectedSpace.address || "כתובת מדויקת טרם אומתה"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClearSelection}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-ink shadow-sm ring-1 ring-ink/10"
              aria-label="חזרה לרשימה"
              title="חזרה לרשימה"
            >
              <ChevronDown className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <dl className="grid grid-cols-2 gap-3 rounded-lg bg-white p-4 ring-1 ring-ink/10">
            <DetailRow
              label="סטטוס"
              value={statusMeta[selectedSpace.status].label}
            />
            <DetailRow
              label="רמת ודאות"
              value={confidenceLabel(selectedSpace.confidence)}
            />
            <DetailRow label="סוג מרחב" value={selectedSpace.type} />
            <DetailRow label="מקור" value={selectedSpace.source} />
          </dl>

          <div className="rounded-lg bg-white p-4 ring-1 ring-ink/10">
            <h2 className="text-sm font-black text-ink">
              מה הציבור אמור לקבל כאן
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink/78">
              {selectedSpace.publicRightSummary}
            </p>
          </div>

          <div className="rounded-lg bg-white p-4 ring-1 ring-ink/10">
            <h2 className="text-sm font-black text-ink">איך נכנסים</h2>
            <p className="mt-2 text-sm leading-6 text-ink/78">
              {selectedSpace.entranceInstructions}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <a
              href={navigationLinks?.googleMaps}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg bg-mapblue px-2 py-2 text-xs font-black text-white"
            >
              <Navigation className="h-5 w-5" aria-hidden="true" />
              נווט
            </a>
            <Link
              href={spaceDetailUrl(selectedSpace)}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg bg-white px-2 py-2 text-xs font-black text-ink ring-1 ring-ink/10"
            >
              <ExternalLink className="h-5 w-5" aria-hidden="true" />
              פרטים
            </Link>
            <Link
              href={spaceReportUrl(selectedSpace)}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg bg-white px-2 py-2 text-xs font-black text-ink ring-1 ring-ink/10"
            >
              <Flag className="h-5 w-5" aria-hidden="true" />
              דווח
            </Link>
            <button
              type="button"
              onClick={() => onShare(selectedSpace)}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg bg-white px-2 py-2 text-xs font-black text-ink ring-1 ring-ink/10"
            >
              <Share2 className="h-5 w-5" aria-hidden="true" />
              שתף
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-normal text-concrete">
                מאגר מועמדים לבדיקה
              </p>
              <h1 className="text-xl font-black leading-7 text-ink">
                {researchEnabled ? "שכבת מחקר לא מאומתת" : "מרחבים מאומתים"}
              </h1>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-extrabold text-ink shadow-sm ring-1 ring-ink/10">
              <ChevronUp className="h-4 w-4 text-mapblue" aria-hidden="true" />
              {mapReadySpaces.length.toLocaleString("he-IL")}
              <span className="text-concrete">/ {spaces.length.toLocaleString("he-IL")}</span>
            </div>
          </div>

          <label className="mb-3 flex min-h-12 items-center justify-between gap-3 rounded-lg bg-white px-3 text-sm font-extrabold text-ink ring-1 ring-ink/10">
            <span>הצג שכבת מחקר לא מאומתת</span>
            <input
              type="checkbox"
              checked={researchEnabled}
              onChange={(event) => onResearchToggle(event.target.checked)}
              className="h-5 w-5 accent-mapblue"
            />
          </label>

          {researchEnabled ? (
            <div className="mb-3 rounded-lg bg-official/20 p-3 text-xs font-bold leading-5 text-ink ring-1 ring-official/40">
              שכבת המחקר אינה רשימה מאומתת של מרחבים פתוחים לציבור. נדרש אימות מול תוכנית, היתר או בדיקת שטח.
            </div>
          ) : null}

          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {filters
              .filter((filter) =>
                researchEnabled
                  ? true
                  : !["candidate_likely_public", "candidate_raw"].includes(
                      filter.key,
                    ),
              )
              .map((filter) => {
                const active = filter.key === activeFilter;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => onFilterChange(filter.key)}
                    className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-extrabold ring-1 transition ${
                      active
                        ? "bg-ink text-white ring-ink"
                        : "bg-white text-ink ring-ink/10"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2 text-xs font-bold text-concrete">
            {filters.slice(1).map((filter) => {
              const meta = statusMeta[filter.key as SpaceStatus];
              return (
                <div key={filter.key} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: meta.markerColor }}
                  />
                  {filter.label}
                </div>
              );
            })}
          </div>

          <div className="flex max-h-[34dvh] flex-col gap-3 overflow-y-auto pb-1 pr-1 md:max-h-[calc(100dvh-21rem)]">
            {loading ? (
              <div className="rounded-lg bg-white p-5 text-center text-sm font-bold text-concrete ring-1 ring-ink/10">
                טוען נתוני מחקר...
              </div>
            ) : rankedSpaces.length === 0 ? (
              <div className="rounded-lg bg-white p-5 text-center text-sm font-bold leading-6 text-concrete ring-1 ring-ink/10">
                {researchEnabled
                  ? "לא נמצאו מועמדים עם מיקום מדויק במסנן הנוכחי."
                  : "עדיין לא נטענו מרחבים מאומתים עם מיקום מדויק. ניתן להציג שכבת מחקר לא מאומתת."}
              </div>
            ) : (
              rankedSpaces.map(({ space, distance }) => (
                <SpaceCard
                  key={space.id}
                  space={space}
                  distance={distance}
                  selected={false}
                  onSelect={onSelect}
                />
              ))
            )}
          </div>

          <p className="mt-3 flex items-start gap-2 text-xs font-semibold leading-5 text-concrete">
            <Diamond className="mt-0.5 h-4 w-4 shrink-0 text-official" aria-hidden="true" />
            נתונים גולמיים מסומנים לבדיקה בלבד. מקור GIS אינו הוכחה לכך שמקום פתוח לציבור.
          </p>
        </>
      )}
    </section>
  );
}
