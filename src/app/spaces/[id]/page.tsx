import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Flag, Navigation } from "lucide-react";
import { MiniMap } from "@/components/MiniMap";
import { StatusBadge } from "@/components/StatusBadge";
import { createNavigationLinks } from "@/lib/navigationLinks";
import type { Space } from "@/lib/normalizeSpace";
import { getSpaceById } from "@/lib/spaceData";
import { statusMeta } from "@/lib/status";

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

function isResearchCandidate(space: Space) {
  return (
    space.verificationStatus === "candidate_raw" ||
    space.verificationStatus === "candidate_likely_public"
  );
}

function sourceEntries(space: Space) {
  return Object.entries(space.sourceFields ?? {})
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim())
    .slice(0, 24);
}

function KeywordList({ title, values }: { title: string; values: string[] }) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-sm font-black text-ink">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="rounded-full bg-background px-3 py-1 text-xs font-bold text-concrete ring-1 ring-ink/10"
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
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
  const researchCandidate = isResearchCandidate(space);

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

        {researchCandidate ? (
          <section className="rounded-lg bg-official/20 p-5 ring-1 ring-official/40">
            <h1 className="text-lg font-black leading-7 text-ink">
              רשומה זו היא מועמדת לבדיקה בלבד
            </h1>
            <p className="mt-2 text-sm font-extrabold leading-6 text-ink/80">
              היא אינה הוכחה לכך שהמקום פתוח לציבור.
            </p>
          </section>
        ) : null}

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
              {researchCandidate
                ? "נדרש אימות נוסף מול מקור תכנוני או בדיקת שטח."
                : "המידע מוצג בזהירות ומתבסס על רמת האימות הנוכחית."}
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
            {space.sourceText ? <li>{space.sourceText}</li> : null}
            {space.sourceUrl ? (
              <li>
                <a
                  href={space.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-mapblue underline"
                >
                  מקור חיצוני
                </a>
              </li>
            ) : null}
            <li>נדרש אימות נוסף מול מקור תכנוני או בדיקת שטח.</li>
          </ul>
        </section>

        {researchCandidate ? (
          <>
            <section className="rounded-lg bg-white p-5 ring-1 ring-ink/10">
              <h2 className="text-lg font-black text-ink">סיבת סיווג</h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-ink/78">
                {space.classificationReason}
              </p>
              <div className="mt-5 space-y-4">
                <KeywordList
                  title="ביטויים חזקים שנמצאו"
                  values={space.matchedStrongPositivePhrases}
                />
                <KeywordList
                  title="מילות מפתח שנמצאו"
                  values={space.matchedPositiveKeywords}
                />
                <KeywordList
                  title="מילות החרגה שנמצאו"
                  values={space.matchedNegativeKeywords}
                />
              </div>
            </section>

            <section className="rounded-lg bg-white p-5 ring-1 ring-ink/10">
              <h2 className="text-lg font-black text-ink">נתוני מקור</h2>
              <dl className="mt-3 grid gap-3 text-sm">
                {sourceEntries(space).map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-background p-3">
                    <dt className="text-xs font-bold text-concrete">{key}</dt>
                    <dd className="mt-1 break-words font-semibold leading-6 text-ink/78">
                      {String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </>
        ) : null}

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
