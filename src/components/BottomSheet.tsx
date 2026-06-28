import { ChevronUp } from "lucide-react";
import { SpaceCard } from "@/components/SpaceCard";
import { distanceKm, type SpaceFeature } from "@/lib/spaces";

type BottomSheetProps = {
  spaces: SpaceFeature[];
  mapCenter: [number, number];
  selectedId?: string;
  onSelect: (feature: SpaceFeature) => void;
};

export function BottomSheet({
  spaces,
  mapCenter,
  selectedId,
  onSelect,
}: BottomSheetProps) {
  const rankedSpaces = spaces
    .map((feature) => ({
      feature,
      distance: distanceKm(mapCenter, feature.properties.center),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 8);

  return (
    <section className="absolute inset-x-0 bottom-0 z-20 max-h-[48dvh] rounded-t-[28px] border-t border-white/70 bg-background/96 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-sheet backdrop-blur md:left-1/2 md:right-auto md:max-h-[calc(100dvh-2rem)] md:w-[420px] md:-translate-x-1/2 md:rounded-[28px] md:border md:bottom-4">
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/18" />

      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-normal text-concrete">
            תל אביב-יפו
          </p>
          <h1 className="text-xl font-black leading-7 text-ink">שטחים קרובים</h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-extrabold text-ink shadow-sm ring-1 ring-ink/10">
          <ChevronUp className="h-4 w-4 text-mapblue" aria-hidden="true" />
          {spaces.length.toLocaleString("he-IL")}
        </div>
      </div>

      <div className="flex max-h-[32dvh] flex-col gap-3 overflow-y-auto pb-1 pr-1 md:max-h-[calc(100dvh-12rem)]">
        {rankedSpaces.map(({ feature, distance }) => (
          <SpaceCard
            key={feature.properties.id}
            feature={feature}
            distance={distance}
            selected={feature.properties.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
