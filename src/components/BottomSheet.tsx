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

export const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "הכל" },
  { key: "verified_open", label: "פתוחים" },
  { key: "official_unverified", label: "מקור רשמי" },
  { key: "unclear", label: "לא ברור" },
  { key: "reported_blocked", label: "דווחו כחסומים" },
];

type BottomSheetProps = {
  spaces: Space[];
  visibleSpaces: Space[];
  mapCenter: [number, number];
  selectedSpace?: Space;
  activeFilter: FilterKey;
  loading: boolean;
  onFilterChange: (filter: FilterKey) => void;
  onSelect: (space: Space) => void;
  onClearSelection: () => void;
  onShare: (space: Space) => void;
};

function confidenceLabel(confidence: Space["confidence"]) {
  if (confidence === "field_verified") {
    return "אומת בשטח";
  }

  if (confidence === "community_reported") {
    return "מבוסס דיווח ציבורי";
  }

  return "מקור רשמי בלבד";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold text-concrete">{label}</dt>
      <dd className="mt-1 text-sm font-extrabold text-ink">{value}</dd>
    </div>
  );
}

export function BottomSheet({
  spaces,
  visibleSpaces,
  mapCenter,
  selectedSpace,
  activeFilter,
  loading,
  onFilterChange,
  onSelect,
  onClearSelection,
  onShare,
}: BottomSheetProps) {
  const rankedSpaces = visibleSpaces
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
    <section className="absolute inset-x-0 bottom-0 z-20 max-h-[68dvh] rounded-t-[28px] border-t border-white/70 bg-background/96 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-sheet backdrop-blur md:bottom-4 md:left-1/2 md:right-auto md:max-h-[calc(100dvh-2rem)] md:w-[440px] md:-translate-x-1/2 md:rounded-[28px] md:border">
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/18" />

      {selectedSpace ? (
        <div className="flex max-h-[58dvh] flex-col gap-4 overflow-y-auto pr-1 md:max-h-[calc(100dvh-5rem)]">
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
            <DetailRow label="סטטוס" value={statusMeta[selectedSpace.status].label} />
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
                תל אביב-יפו
              </p>
              <h1 className="text-xl font-black leading-7 text-ink">
                מרחבים קרובים
              </h1>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-extrabold text-ink shadow-sm ring-1 ring-ink/10">
              <ChevronUp className="h-4 w-4 text-mapblue" aria-hidden="true" />
              {visibleSpaces.length.toLocaleString("he-IL")}
              <span className="text-concrete">/ {spaces.length.toLocaleString("he-IL")}</span>
            </div>
          </div>

          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {filters.map((filter) => {
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

          <div className="flex max-h-[34dvh] flex-col gap-3 overflow-y-auto pb-1 pr-1 md:max-h-[calc(100dvh-18rem)]">
            {loading ? (
              <div className="rounded-lg bg-white p-5 text-center text-sm font-bold text-concrete ring-1 ring-ink/10">
                טוען מרחבים ציבוריים...
              </div>
            ) : rankedSpaces.length === 0 ? (
              <div className="rounded-lg bg-white p-5 text-center text-sm font-bold text-concrete ring-1 ring-ink/10">
                לא נמצאו מרחבים במסנן הנוכחי.
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
            הנתונים הם נקודת פתיחה עיתונאית. מקור רשמי אינו מחליף בדיקת שטח או מקור תכנוני מלא.
          </p>
        </>
      )}
    </section>
  );
}
