import type { Feature, Geometry, MultiPolygon, Polygon } from "geojson";
import type { SpaceStatus } from "@/lib/status";

export type SpaceConfidence =
  | "official_source_only"
  | "field_verified"
  | "community_reported";

export type RawSpaceProperties = {
  id?: string;
  objectId?: number;
  assetId?: string;
  name?: string;
  description?: string;
  address?: string;
  status?: string;
  source?: string;
  kind?: string;
  type?: string;
  areaSqm?: number;
  perimeterM?: number;
  importedAt?: string;
  center?: [number, number];
  centroid?: [number, number];
  publicRightSummary?: string;
  entranceInstructions?: string;
  confidence?: SpaceConfidence;
};

export type RawSpaceFeature = Feature<Polygon | MultiPolygon, RawSpaceProperties>;

export type Space = {
  id: string;
  name: string;
  address: string;
  geometry: Polygon | MultiPolygon;
  centroid: [number, number];
  status: SpaceStatus;
  type: string;
  source: string;
  confidence: SpaceConfidence;
  publicRightSummary: string;
  entranceInstructions: string;
  areaSqm?: number;
  assetId?: string;
  rawFeature: RawSpaceFeature;
};

export const DEFAULT_PUBLIC_RIGHT_SUMMARY =
  "המקום מופיע במקור עירוני או תכנוני, אך נדרש אימות נוסף לפני קביעה מלאה לגבי אופי הזכות הציבורית.";

export const DEFAULT_ENTRANCE_INSTRUCTIONS =
  "טרם הוזנו הוראות כניסה. נדרש אימות שטח.";

const statusMap: Record<string, SpaceStatus> = {
  open: "verified_open",
  official: "official_unverified",
  problem: "unclear",
  blocked: "reported_blocked",
  closed: "closed",
  verified_open: "verified_open",
  official_unverified: "official_unverified",
  unclear: "unclear",
  reported_blocked: "reported_blocked",
};

function clean(value?: string) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function isPolygonGeometry(geometry: Geometry): geometry is Polygon | MultiPolygon {
  return geometry.type === "Polygon" || geometry.type === "MultiPolygon";
}

function coordinatesFromGeometry(geometry: Polygon | MultiPolygon) {
  return geometry.type === "Polygon"
    ? geometry.coordinates.flat(1)
    : geometry.coordinates.flat(2);
}

export function calculateCentroid(geometry: Polygon | MultiPolygon): [number, number] {
  const points = coordinatesFromGeometry(geometry);
  if (points.length === 0) {
    return [34.7818, 32.0853];
  }

  const [lngTotal, latTotal] = points.reduce(
    (acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat],
    [0, 0],
  );

  return [lngTotal / points.length, latTotal / points.length];
}

export function getGeometryBounds(geometry: Polygon | MultiPolygon) {
  const points = coordinatesFromGeometry(geometry);
  const first = points[0];
  if (!first) {
    return null;
  }

  return points.reduce(
    (bounds, [lng, lat]) => ({
      west: Math.min(bounds.west, lng),
      south: Math.min(bounds.south, lat),
      east: Math.max(bounds.east, lng),
      north: Math.max(bounds.north, lat),
    }),
    {
      west: first[0],
      south: first[1],
      east: first[0],
      north: first[1],
    },
  );
}

export function normalizeSpace(feature: RawSpaceFeature, index = 0): Space {
  if (!isPolygonGeometry(feature.geometry)) {
    throw new Error("Space feature must use Polygon or MultiPolygon geometry.");
  }

  const properties = feature.properties ?? {};
  const objectId = properties.objectId ?? index + 1;
  const id = clean(properties.id) || `tlv-space-${objectId}`;
  const description = clean(properties.description);
  const name = description || clean(properties.name) || `מרחב ציבורי ${objectId}`;
  const status = statusMap[clean(properties.status)] ?? "official_unverified";
  const centroid = properties.centroid ?? properties.center ?? calculateCentroid(feature.geometry);

  return {
    id,
    name,
    address: clean(properties.address),
    geometry: feature.geometry,
    centroid,
    status,
    type: clean(properties.type) || clean(properties.kind) || "זיקת הנאה",
    source: clean(properties.source) || "מקור עירוני או תכנוני",
    confidence: properties.confidence ?? "official_source_only",
    publicRightSummary:
      clean(properties.publicRightSummary) || DEFAULT_PUBLIC_RIGHT_SUMMARY,
    entranceInstructions:
      clean(properties.entranceInstructions) || DEFAULT_ENTRANCE_INSTRUCTIONS,
    areaSqm: properties.areaSqm,
    assetId: clean(properties.assetId) || undefined,
    rawFeature: {
      ...feature,
      id,
      properties: {
        ...properties,
        id,
        status,
        description: name,
        center: centroid,
      },
    },
  };
}

export function normalizeSpaces(features: RawSpaceFeature[]) {
  return features.flatMap((feature, index) => {
    try {
      return [normalizeSpace(feature, index)];
    } catch {
      return [];
    }
  });
}

export function spaceToFeature(space: Space): RawSpaceFeature {
  return {
    ...space.rawFeature,
    id: space.id,
    geometry: space.geometry,
    properties: {
      ...space.rawFeature.properties,
      id: space.id,
      name: space.name,
      description: space.name,
      address: space.address,
      status: space.status,
      kind: space.type,
      source: space.source,
      center: space.centroid,
      publicRightSummary: space.publicRightSummary,
      entranceInstructions: space.entranceInstructions,
      confidence: space.confidence,
      areaSqm: space.areaSqm,
      assetId: space.assetId,
    },
  };
}
