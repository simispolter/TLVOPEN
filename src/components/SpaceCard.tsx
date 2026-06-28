import { ArrowUpLeft, MapPin, Ruler } from "lucide-react";
import { formatArea, type SpaceFeature } from "@/lib/spaces";
import { StatusBadge } from "./StatusBadge";

type SpaceCardProps = {
  feature: SpaceFeature;
  distance?: number;
  selected?: boolean;
  onSelect: (feature: SpaceFeature) => void;
};

export function SpaceCard({
  feature,
  distance,
  selected = false,
  onSelect,
}: SpaceCardProps) {
  const { properties } = feature;

  return (
    <button
      type="button"
      onClick={() => onSelect(feature)}
      className={`w-full rounded-lg border bg-white p-4 text-right shadow-sm transition active:scale-[0.99] ${
        selected
          ? "border-mapblue ring-2 ring-mapblue/20"
          : "border-ink/10 hover:border-mapblue/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={properties.status} />
            {distance !== undefined ? (
              <span className="inline-flex h-7 items-center gap-1 rounded-full bg-background px-3 text-xs font-bold text-concrete ring-1 ring-ink/10">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {distance.toFixed(1)} ק״מ
              </span>
            ) : null}
          </div>

          <h2 className="mt-3 line-clamp-2 text-base font-extrabold leading-6 text-ink">
            {properties.description || properties.name}
          </h2>
        </div>

        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mapblue text-white">
          <ArrowUpLeft className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-concrete">
        <span className="inline-flex items-center gap-1">
          <Ruler className="h-4 w-4" aria-hidden="true" />
          {formatArea(properties.areaSqm)}
        </span>
        {properties.assetId ? <span>נכס {properties.assetId}</span> : null}
      </div>
    </button>
  );
}
