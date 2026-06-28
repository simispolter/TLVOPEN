"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, Layers, Search } from "lucide-react";
import type {
  GeoJSONSource,
  Map as MapLibreMap,
  MapGeoJSONFeature,
  StyleSpecification,
} from "maplibre-gl";
import { BottomSheet } from "@/components/BottomSheet";
import {
  TEL_AVIV_CENTER,
  type SpaceFeature,
  type SpacesCollection,
} from "@/lib/spaces";

const fillLayerId = "public-spaces-fill";
const lineLayerId = "public-spaces-line";
const selectedLineLayerId = "public-spaces-selected-line";

const osmStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
};

function isSpaceFeature(feature: MapGeoJSONFeature): feature is MapGeoJSONFeature & {
  properties: SpaceFeature["properties"];
} {
  return Boolean(feature.properties?.id);
}

export function PublicMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<import("maplibre-gl").Popup | null>(null);
  const [spaces, setSpaces] = useState<SpaceFeature[]>([]);
  const [mapCenter, setMapCenter] =
    useState<[number, number]>(TEL_AVIV_CENTER);
  const [selectedId, setSelectedId] = useState<string>();

  const collection = useMemo<SpacesCollection>(
    () => ({
      type: "FeatureCollection",
      features: spaces,
    }),
    [spaces],
  );

  const flyToFeature = useCallback((feature: SpaceFeature) => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const [lng, lat] = feature.properties.center;
    setSelectedId(feature.properties.id);
    map.flyTo({ center: [lng, lat], zoom: 17, duration: 700 });
  }, []);

  useEffect(() => {
    fetch("/data/public-spaces.geojson")
      .then((response) => response.json() as Promise<SpacesCollection>)
      .then((data) => setSpaces(data.features))
      .catch(() => setSpaces([]));
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
        style: osmStyle,
        center: TEL_AVIV_CENTER,
        zoom: 12.4,
        attributionControl: false,
      });

      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        "bottom-left",
      );

      map.on("moveend", () => {
        const center = map.getCenter();
        setMapCenter([center.lng, center.lat]);
      });

      map.on("load", () => {
        map.addSource("public-spaces", {
          type: "geojson",
          data: collection,
        });

        map.addLayer({
          id: fillLayerId,
          type: "fill",
          source: "public-spaces",
          paint: {
            "fill-color": [
              "match",
              ["get", "status"],
              "open",
              "#18A558",
              "problem",
              "#F97316",
              "blocked",
              "#DC2626",
              "#F5B700",
            ],
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              0.48,
              0.28,
            ],
          },
        });

        map.addLayer({
          id: lineLayerId,
          type: "line",
          source: "public-spaces",
          paint: {
            "line-color": "#18212B",
            "line-opacity": 0.45,
            "line-width": 1.2,
          },
        });

        map.addLayer({
          id: selectedLineLayerId,
          type: "line",
          source: "public-spaces",
          filter: ["==", ["get", "id"], ""],
          paint: {
            "line-color": "#2563EB",
            "line-width": 3,
          },
        });

        map.on("click", fillLayerId, (event) => {
          const feature = event.features?.[0];
          if (!feature || !isSpaceFeature(feature)) {
            return;
          }

          setSelectedId(feature.properties.id);
          popupRef.current?.remove();
          popupRef.current = new maplibregl.Popup({
            closeButton: false,
            offset: 16,
            maxWidth: "280px",
          })
            .setLngLat(event.lngLat)
            .setHTML(
              `<div style="padding:12px;max-width:280px"><strong style="display:block;margin-bottom:6px">${feature.properties.description}</strong><span style="color:#64748B;font-size:13px">רשום עירוני</span></div>`,
            )
            .addTo(map);
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
      popupRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [collection]);

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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="pointer-events-auto rounded-full bg-background/94 px-4 py-3 shadow-float ring-1 ring-white/70 backdrop-blur">
            <p className="text-lg font-black leading-none text-ink">פתוח לציבור</p>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-float ring-1 ring-ink/10"
              title="חיפוש"
              aria-label="חיפוש"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-float ring-1 ring-ink/10"
              title="שכבות"
              aria-label="שכבות"
            >
              <Layers className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => mapRef.current?.flyTo({ center: TEL_AVIV_CENTER, zoom: 12.4 })}
              className="grid h-11 w-11 place-items-center rounded-full bg-mapblue text-white shadow-float"
              title="מרכז תל אביב"
              aria-label="מרכז תל אביב"
            >
              <Crosshair className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div className="pointer-events-none absolute bottom-[50dvh] right-4 z-10 hidden rounded-lg bg-white/94 p-3 shadow-float ring-1 ring-ink/10 backdrop-blur sm:block">
        <div className="flex items-center gap-2 text-xs font-bold text-concrete">
          <span className="h-3 w-3 rounded-sm bg-official" />
          זיקת הנאה רשומה
        </div>
      </div>

      <BottomSheet
        spaces={spaces}
        mapCenter={mapCenter}
        selectedId={selectedId}
        onSelect={flyToFeature}
      />
    </main>
  );
}
