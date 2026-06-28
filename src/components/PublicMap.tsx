"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, Layers, Search } from "lucide-react";
import type {
  GeoJSONSource,
  Map as MapLibreMap,
  MapGeoJSONFeature,
  StyleSpecification,
} from "maplibre-gl";
import { BottomSheet, type FilterKey } from "@/components/BottomSheet";
import {
  getGeometryBounds,
  normalizeSpaces,
  spaceToFeature,
  type RawSpaceFeature,
  type Space,
} from "@/lib/normalizeSpace";
import { shareSpace } from "@/lib/share";
import { TEL_AVIV_CENTER, type SpacesCollection } from "@/lib/spaces";

const fillLayerId = "public-spaces-fill";
const lineLayerId = "public-spaces-line";
const selectedLineLayerId = "public-spaces-selected-line";

const localMapStyle: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#E8E0D2",
      },
    },
  ],
};

function isSpaceFeature(feature: MapGeoJSONFeature): feature is MapGeoJSONFeature & {
  properties: { id: string };
} {
  return Boolean(feature.properties?.id);
}

function featureCollection(spaces: Space[]): SpacesCollection {
  return {
    type: "FeatureCollection",
    features: spaces.map(spaceToFeature),
  };
}

function matchesQuery(space: Space, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("he-IL");
  if (!normalizedQuery) {
    return true;
  }

  return [space.name, space.address, space.type, space.source]
    .join(" ")
    .toLocaleLowerCase("he-IL")
    .includes(normalizedQuery);
}

export function PublicMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const spacesRef = useRef<Space[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [mapCenter, setMapCenter] =
    useState<[number, number]>(TEL_AVIV_CENTER);
  const [selectedId, setSelectedId] = useState<string>();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [shareMessage, setShareMessage] = useState("");

  const visibleSpaces = useMemo(
    () =>
      spaces.filter((space) => {
        const filterMatch =
          activeFilter === "all" ? true : space.status === activeFilter;
        return filterMatch && matchesQuery(space, searchQuery);
      }),
    [activeFilter, searchQuery, spaces],
  );

  const selectedSpace = useMemo(
    () => spaces.find((space) => space.id === selectedId),
    [selectedId, spaces],
  );

  const collection = useMemo(
    () => featureCollection(visibleSpaces),
    [visibleSpaces],
  );

  const fitSpace = useCallback((space: Space) => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const bounds = getGeometryBounds(space.geometry);
    if (!bounds) {
      map.flyTo({ center: space.centroid, zoom: 17, duration: 700 });
      return;
    }

    map.fitBounds(
      [
        [bounds.west, bounds.south],
        [bounds.east, bounds.north],
      ],
      {
        padding: { top: 132, bottom: 380, left: 44, right: 44 },
        maxZoom: 17,
        duration: 700,
      },
    );
  }, []);

  const selectSpace = useCallback(
    (space: Space) => {
      setSelectedId(space.id);
      fitSpace(space);
    },
    [fitSpace],
  );

  const handleFilterChange = useCallback((filter: FilterKey) => {
    setActiveFilter(filter);
    setSelectedId(undefined);
  }, []);

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      mapRef.current?.flyTo({ center: TEL_AVIV_CENTER, zoom: 12.8 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapRef.current?.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 15,
          duration: 700,
        });
      },
      () => mapRef.current?.flyTo({ center: TEL_AVIV_CENTER, zoom: 12.8 }),
      { enableHighAccuracy: true, timeout: 6000 },
    );
  }, []);

  const handleShare = useCallback(async (space: Space) => {
    try {
      const result = await shareSpace(space);
      setShareMessage(result === "copied" ? "הקישור הועתק" : "השיתוף נפתח");
      window.setTimeout(() => setShareMessage(""), 2500);
    } catch {
      setShareMessage("לא הצלחנו לשתף כרגע");
      window.setTimeout(() => setShareMessage(""), 2500);
    }
  }, []);

  useEffect(() => {
    spacesRef.current = spaces;
  }, [spaces]);

  useEffect(() => {
    fetch("/data/public-spaces.geojson")
      .then((response) => response.json() as Promise<SpacesCollection>)
      .then((data) => setSpaces(normalizeSpaces(data.features as RawSpaceFeature[])))
      .catch(() => setSpaces([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapContainerRef.current || mapRef.current) {
        return;
      }

      const maplibregl = await import("maplibre-gl");
      if (cancelled || !mapContainerRef.current) {
        return;
      }

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: localMapStyle,
        center: TEL_AVIV_CENTER,
        zoom: 12.4,
        attributionControl: false,
      });

      map.on("moveend", () => {
        const center = map.getCenter();
        setMapCenter([center.lng, center.lat]);
      });

      map.on("load", () => {
        map.addSource("public-spaces", {
          type: "geojson",
          data: featureCollection([]),
        });

        map.addLayer({
          id: fillLayerId,
          type: "fill",
          source: "public-spaces",
          paint: {
            "fill-color": [
              "match",
              ["get", "status"],
              "verified_open",
              "#18A558",
              "official_unverified",
              "#F5B700",
              "unclear",
              "#F97316",
              "reported_blocked",
              "#DC2626",
              "closed",
              "#64748B",
              "#F5B700",
            ],
            "fill-opacity": 0.38,
          },
        });

        map.addLayer({
          id: lineLayerId,
          type: "line",
          source: "public-spaces",
          paint: {
            "line-color": "#18212B",
            "line-opacity": 0.45,
            "line-width": 1.4,
          },
        });

        map.addLayer({
          id: selectedLineLayerId,
          type: "line",
          source: "public-spaces",
          filter: ["==", ["get", "id"], ""],
          paint: {
            "line-color": "#2563EB",
            "line-width": 4,
          },
        });

        map.on("click", fillLayerId, (event) => {
          const feature = event.features?.[0];
          if (!feature || !isSpaceFeature(feature)) {
            return;
          }

          const space = spacesRef.current.find(
            (item) => item.id === feature.properties.id,
          );
          if (space) {
            selectSpace(space);
          }
        });

        map.on("mouseenter", fillLayerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", fillLayerId, () => {
          map.getCanvas().style.cursor = "";
        });
      });

      mapRef.current = map;
    }

    initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [selectSpace]);

  useEffect(() => {
    const source = mapRef.current?.getSource("public-spaces") as
      | GeoJSONSource
      | undefined;
    if (source) {
      source.setData(collection);
    }
  }, [collection]);

  useEffect(() => {
    const map = mapRef.current;
    if (map?.getLayer(selectedLineLayerId)) {
      map.setFilter(selectedLineLayerId, [
        "==",
        ["get", "id"],
        selectedId ?? "",
      ]);
    }
  }, [selectedId]);

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-background text-ink">
      <div ref={mapContainerRef} className="absolute inset-0" />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3">
          <div className="pointer-events-auto rounded-2xl bg-background/94 p-4 shadow-float ring-1 ring-white/70 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xl font-black leading-none text-ink">
                  פתוח לציבור
                </p>
                <p className="mt-2 text-sm font-bold leading-5 text-concrete">
                  מפה של מרחבים פרטיים שאמורים להיות נגישים לציבור
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-sm ring-1 ring-ink/10"
                  title="שכבות"
                  aria-label="שכבות"
                >
                  <Layers className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={locateUser}
                  className="grid h-11 w-11 place-items-center rounded-full bg-mapblue text-white shadow-sm"
                  title="איתור המיקום שלי"
                  aria-label="איתור המיקום שלי"
                >
                  <Crosshair className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <label className="mt-4 flex min-h-12 items-center gap-2 rounded-full bg-white px-4 text-ink shadow-sm ring-1 ring-ink/10">
              <Search className="h-5 w-5 shrink-0 text-concrete" aria-hidden="true" />
              <input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSelectedId(undefined);
                }}
                placeholder="חפש כתובת, רחוב או מקום"
                className="h-11 min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-concrete"
              />
            </label>
          </div>
        </div>
      </header>

      {shareMessage ? (
        <div className="absolute left-1/2 top-[10rem] z-30 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-black text-white shadow-float">
          {shareMessage}
        </div>
      ) : null}

      <BottomSheet
        spaces={spaces}
        visibleSpaces={visibleSpaces}
        mapCenter={mapCenter}
        selectedSpace={selectedSpace}
        activeFilter={activeFilter}
        loading={loading}
        onFilterChange={handleFilterChange}
        onSelect={selectSpace}
        onClearSelection={() => setSelectedId(undefined)}
        onShare={handleShare}
      />
    </main>
  );
}
