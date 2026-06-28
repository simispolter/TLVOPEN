import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import type { RawSpaceFeature, RawSpaceProperties } from "@/lib/normalizeSpace";

export type SpaceFeature = RawSpaceFeature;

export type SpacesCollection = FeatureCollection<
  Polygon | MultiPolygon | null,
  RawSpaceProperties
>;

export const TEL_AVIV_CENTER: [number, number] = [34.7818, 32.0853];

export function formatArea(areaSqm?: number) {
  if (!areaSqm || Number.isNaN(areaSqm)) {
    return "שטח לא ידוע";
  }

  return `${Math.round(areaSqm).toLocaleString("he-IL")} מ״ר`;
}

export function distanceKm(a: [number, number], b?: [number, number] | null) {
  if (!b) {
    return Number.POSITIVE_INFINITY;
  }

  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}
