import { ArrowUpLeft, MapPin, Ruler } from "lucide-react";
import type { Space } from "@/lib/normalizeSpace";
import { formatArea } from "@/lib/spaces";
import { StatusBadge } from "./StatusBadge";

type SpaceCardProps = {
  space: Space;
  distance?: number;
  selected?: boolean;
  onSelect: (space: Space) => void;
};

export function SpaceCard({
  space,
  distance,
  selected = false,
  onSelect,
}: SpaceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(space)}
      className={`w-full rounded-lg border bg-white p-4 text-right shadow-sm transition active:scale-[0.99] ${
        selected
          ? "border-mapblue ring-2 ring-mapblue/20"
          : "border-ink/10 hover:border-mapblue/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={space.status} />
            {distance !== undefined ? (
              <span className="inline-flex h-7 items-center gap-1 rounded-full bg-background px-3 text-xs font-bold text-concrete ring-1 ring-ink/10">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {distance.toFixed(1)} ק״מ
              </span>
            ) : null}
          </div>

          <h2 className="mt-3 line-clamp-2 text-base font-extrabold leading-6 text-ink">
            {space.name}
          </h2>
          <p className="mt-1 line-clamp-1 text-sm font-semibold text-concrete">
            {space.address || space.type}
          </p>
        </div>

        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mapblue text-white">
          <ArrowUpLeft className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-concrete">
        <span className="inline-flex items-center gap-1">
          <Ruler className="h-4 w-4" aria-hidden="true" />
          {formatArea(space.areaSqm)}
        </span>
        {space.assetId ? <span>נכס {space.assetId}</span> : null}
      </div>
    </button>
  );
}
