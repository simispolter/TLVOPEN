import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Flag, Navigation } from "lucide-react";
import { MiniMap } from "@/components/MiniMap";
import { StatusBadge } from "@/components/StatusBadge";
import { createNavigationLinks } from "@/lib/navigationLinks";
import { getAllSpaces, getSpaceById } from "@/lib/spaceData";
import { statusMeta } from "@/lib/status";

export function generateStaticParams() {
  return getAllSpaces().map((space) => ({ id: space.id }));
}

function confidenceLabel(confidence: string) {
  if (confidence === "field_verified") {
    return "אומת בשטח";
  }

  if (confidence === "community_reported") {
    return "מבוסס דיווח ציבורי";
  }

  return "מקור רשמי בלבד";
}

export default async function SpaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const space = getSpaceById(decodeURIComponent(id));

  if (!space) {
    notFound();
  }

  const navigationLinks = createNavigationLinks(space);

  return (
    <main className="min-h-dvh bg-background px-4 py-5 text-ink">
      <div className="mx-auto max-w-2xl space-y-5">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-ink ring-1 ring-ink/10"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          חזרה למפה
        </Link>

        <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-ink/10">
          <StatusBadge status={space.status} />
          <h1 className="mt-4 text-2xl font-black leading-9 text-ink">
            {space.name}
          </h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-concrete">
            {space.address || "כתובת מדויקת טרם אומתה"}
          </p>
        </section>

        <MiniMap space={space} />

        <section className="grid gap-3 rounded-lg bg-white p-4 ring-1 ring-ink/10 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold text-concrete">סטטוס</p>
            <p className="mt-1 text-sm font-black text-ink">
              {statusMeta[space.status].label}
            </p>
            <p className="mt-2 text-sm leading-6 text-concrete">
              {statusMeta[space.status].description}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-concrete">רמת ודאות</p>
            <p className="mt-1 text-sm font-black text-ink">
              {confidenceLabel(space.confidence)}
            </p>
            <p className="mt-2 text-sm leading-6 text-concrete">
              נדרש אימות נוסף מול מקור תכנוני או בדיקת שטח.
            </p>
          </div>
        </section>

        <section className="rounded-lg bg-white p-5 ring-1 ring-ink/10">
          <h2 className="text-lg font-black text-ink">
            מה הציבור אמור לקבל כאן
          </h2>
          <p className="mt-3 text-sm font-semibold leading-7 text-ink/78">
            {space.publicRightSummary}
          </p>
        </section>

        <section className="rounded-lg bg-white p-5 ring-1 ring-ink/10">
          <h2 className="text-lg font-black text-ink">איך נכנסים</h2>
          <p className="mt-3 text-sm font-semibold leading-7 text-ink/78">
            {space.entranceInstructions}
          </p>
        </section>

        <section className="rounded-lg bg-white p-5 ring-1 ring-ink/10">
          <h2 className="text-lg font-black text-ink">מקורות</h2>
          <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-concrete">
            <li>{space.source}</li>
            {space.assetId ? <li>מספר נכס: {space.assetId}</li> : null}
            <li>נדרש אימות נוסף מול מקור תכנוני או בדיקת שטח.</li>
          </ul>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <a
            href={navigationLinks.googleMaps}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-mapblue px-5 text-sm font-black text-white"
          >
            <Navigation className="h-5 w-5" aria-hidden="true" />
            נווט למקום
          </a>
          <Link
            href={`/report/${encodeURIComponent(space.id)}`}
            className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-ink ring-1 ring-ink/10"
          >
            <Flag className="h-5 w-5" aria-hidden="true" />
            דווח על בעיה
          </Link>
        </section>
      </div>
    </main>
  );
}
