"use client";

import { useEffect, useRef } from "react";
import type { Feature, Geometry } from "geojson";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import {
  getGeometryBounds,
  spaceToFeature,
  type Space,
} from "@/lib/normalizeSpace";

const previewStyle: StyleSpecification = {
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

type MiniMapProps = {
  space: Space;
};

export function MiniMap({ space }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!containerRef.current || mapRef.current) {
        return;
      }

      const maplibregl = await import("maplibre-gl");
      if (cancelled || !containerRef.current) {
        return;
      }

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: previewStyle,
        center: space.centroid ?? [34.7818, 32.0853],
        zoom: 16,
        interactive: false,
        attributionControl: false,
      });

      map.on("load", () => {
        if (!space.geometry) {
          return;
        }

        const feature = spaceToFeature(space) as Feature<Geometry>;

        map.addSource("space", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [feature],
          },
        });

        map.addLayer({
          id: "space-fill",
          type: "fill",
          source: "space",
          paint: {
            "fill-color": "#F5B700",
            "fill-opacity": 0.42,
          },
        });

        map.addLayer({
          id: "space-line",
          type: "line",
          source: "space",
          paint: {
            "line-color": "#2563EB",
            "line-width": 3,
          },
        });

        const bounds = getGeometryBounds(space.geometry);
        if (bounds) {
          map.fitBounds(
            [
              [bounds.west, bounds.south],
              [bounds.east, bounds.north],
            ],
            { padding: 34, maxZoom: 17, duration: 0 },
          );
        }
      });

      mapRef.current = map;
    }

    initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [space]);

  return (
    <div className="relative h-48 overflow-hidden rounded-lg bg-[#E8E0D2] ring-1 ring-ink/10">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-3 top-3 rounded-full bg-white/90 px-3 py-2 text-xs font-black text-ink shadow-sm">
        {space.geometry ? "תצוגת מיקום מקורבת" : "עדיין אין מיקום מדויק להצגה"}
      </div>
    </div>
  );
}
