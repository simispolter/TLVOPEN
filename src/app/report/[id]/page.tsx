import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ReportForm } from "@/components/ReportForm";
import { getAllSpaces, getSpaceById } from "@/lib/spaceData";

export function generateStaticParams() {
  return getAllSpaces().map((space) => ({ id: space.id }));
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const space = getSpaceById(decodeURIComponent(id));

  if (!space) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-5 text-ink">
      <div className="mx-auto max-w-xl space-y-5">
        <Link
          href={`/spaces/${encodeURIComponent(space.id)}`}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-ink ring-1 ring-ink/10"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          חזרה לפרטים
        </Link>

        <ReportForm space={space} />
      </div>
    </main>
  );
}
