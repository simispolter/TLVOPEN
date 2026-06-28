import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

export type SpaceStatus = "open" | "official" | "problem" | "blocked";

export type SpaceProperties = {
  id: string;
  objectId: number;
  assetId?: string;
  name: string;
  description: string;
  status: SpaceStatus;
  source: string;
  kind: string;
  areaSqm?: number;
  perimeterM?: number;
  importedAt?: string;
  center: [number, number];
};

export type SpaceFeature = Feature<Polygon | MultiPolygon, SpaceProperties>;

export type SpacesCollection = FeatureCollection<
  Polygon | MultiPolygon,
  SpaceProperties
>;

export const TEL_AVIV_CENTER: [number, number] = [34.7818, 32.0853];

export function formatArea(areaSqm?: number) {
  if (!areaSqm || Number.isNaN(areaSqm)) {
    return "שטח לא ידוע";
  }

  return `${Math.round(areaSqm).toLocaleString("he-IL")} מ״ר`;
}

export function distanceKm(a: [number, number], b: [number, number]) {
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
