import type { Feature, Geometry, MultiPolygon, Polygon } from "geojson";
import { classifySpace, type ClassificationResult } from "@/lib/classifySpace";
import { getSpaceDisplayName } from "@/lib/getSpaceDisplayName";
import type { SpaceConfidence, VerificationStatus } from "@/lib/status";

export type RawSpaceProperties = Record<string, unknown> & {
  id?: string;
  sourceLayer?: string;
  sourceObjectId?: string | number;
  objectId?: number;
  OBJECTID?: number;
  assetId?: string;
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  status?: string;
  verificationStatus?: VerificationStatus;
  source?: string;
  sourceText?: string;
  sourceUrl?: string;
  kind?: string;
  type?: string;
  areaSqm?: number;
  Shape_Area?: number;
  perimeterM?: number;
  importedAt?: string;
  center?: [number, number] | null;
  centroid?: [number, number] | null;
  publicRightSummary?: string;
  entranceInstructions?: string;
  confidence?: SpaceConfidence;
  classification?: Partial<ClassificationResult>;
  classificationReason?: string;
  matchedPositiveKeywords?: string[];
  matchedStrongPositivePhrases?: string[];
  matchedNegativeKeywords?: string[];
  isPubliclyVisible?: boolean;
  rawProperties?: Record<string, unknown>;
  sourceFields?: Record<string, unknown>;
  reviewNotes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SpaceGeometry = Polygon | MultiPolygon | null;

export type RawSpaceFeature = Feature<Polygon | MultiPolygon | null, RawSpaceProperties>;

export type Space = {
  id: string;
  sourceLayer: string;
  sourceObjectId: string;
  name: string;
  address: string;
  city: string;
  geometry: SpaceGeometry;
  centroid: [number, number] | null;
  type: string;
  verificationStatus: VerificationStatus;
  status: VerificationStatus;
  confidence: SpaceConfidence;
  publicRightSummary: string;
  entranceInstructions: string;
  source: string;
  sourceText: string;
  sourceUrl: string;
  sourceFields: Record<string, unknown>;
  rawProperties: Record<string, unknown>;
  reviewNotes: string;
  isPubliclyVisible: boolean;
  classificationReason: string;
  matchedPositiveKeywords: string[];
  matchedStrongPositivePhrases: string[];
  matchedNegativeKeywords: string[];
  createdAt: string;
  updatedAt: string;
  areaSqm?: number;
  assetId?: string;
  rawFeature: RawSpaceFeature;
};

export const DEFAULT_PUBLIC_RIGHT_SUMMARY =
  "נדרש אימות נוסף מול מקור תכנוני או בדיקת שטח לפני קביעה שהמקום פתוח לציבור.";

export const DEFAULT_ENTRANCE_INSTRUCTIONS =
  "טרם הוזנו הוראות כניסה. נדרש אימות שטח.";

const legacyStatusMap: Record<string, VerificationStatus> = {
  open: "field_verified_open",
  official: "candidate_raw",
  problem: "candidate_raw",
  blocked: "reported_blocked",
  closed: "excluded",
  verified_open: "field_verified_open",
  official_unverified: "candidate_raw",
  unclear: "candidate_raw",
  reported_blocked: "reported_blocked",
};

function clean(value: unknown) {
  return value === null || value === undefined
    ? ""
    : String(value).replace(/\s+/g, " ").trim();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function isPolygonGeometry(
  geometry: Geometry | null,
): geometry is Polygon | MultiPolygon {
  return geometry?.type === "Polygon" || geometry?.type === "MultiPolygon";
}

function coordinatesFromGeometry(geometry: Polygon | MultiPolygon) {
  return geometry.type === "Polygon"
    ? geometry.coordinates.flat(1)
    : geometry.coordinates.flat(2);
}

export function calculateCentroid(
  geometry: Polygon | MultiPolygon,
): [number, number] {
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

export function getGeometryBounds(geometry: SpaceGeometry) {
  if (!geometry) {
    return null;
  }

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

function readCentroid(properties: RawSpaceProperties, geometry: SpaceGeometry) {
  if (Array.isArray(properties.centroid) && properties.centroid.length === 2) {
    return properties.centroid;
  }

  if (Array.isArray(properties.center) && properties.center.length === 2) {
    return properties.center;
  }

  return geometry ? calculateCentroid(geometry) : null;
}

function coerceStatus(
  properties: RawSpaceProperties,
  classification: ClassificationResult,
): VerificationStatus {
  const explicit = clean(properties.verificationStatus || properties.status);
  return (
    (explicit as VerificationStatus) in legacyStatusMap
      ? legacyStatusMap[explicit]
      : (explicit as VerificationStatus)
  ) || classification.verificationStatus;
}

export function normalizeSpace(feature: RawSpaceFeature, index = 0): Space {
  const geometry = isPolygonGeometry(feature.geometry) ? feature.geometry : null;
  const properties = feature.properties ?? {};
  const rawProperties = {
    ...asRecord(properties.rawProperties),
    ...properties,
  };
  const classification = {
    ...classifySpace(rawProperties),
    ...asRecord(properties.classification),
  } as ClassificationResult;
  const sourceObjectId = clean(
    properties.sourceObjectId ?? properties.objectId ?? properties.OBJECTID ?? index + 1,
  );
  const sourceLayer = clean(properties.sourceLayer) || "local";
  const id =
    clean(properties.id) ||
    `${sourceLayer.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, "-")}-${sourceObjectId}`;
  const verificationStatus = coerceStatus(properties, classification);
  const confidence = properties.confidence ?? classification.confidence;
  const centroid = readCentroid(properties, geometry);
  const sourceFields = {
    ...asRecord(properties.sourceFields),
  };
  const isPubliclyVisible =
    typeof properties.isPubliclyVisible === "boolean"
      ? properties.isPubliclyVisible
      : classification.isPubliclyVisible;

  return {
    id,
    sourceLayer,
    sourceObjectId,
    name: getSpaceDisplayName(properties),
    address: clean(properties.address),
    city: clean(properties.city) || "תל אביב-יפו",
    geometry,
    centroid,
    type: clean(properties.type) || clean(properties.kind) || "מועמד לבדיקה",
    verificationStatus,
    status: verificationStatus,
    confidence,
    publicRightSummary:
      clean(properties.publicRightSummary) || DEFAULT_PUBLIC_RIGHT_SUMMARY,
    entranceInstructions:
      clean(properties.entranceInstructions) || DEFAULT_ENTRANCE_INSTRUCTIONS,
    source: clean(properties.source) || clean(properties.sourceLayer) || "מקור GIS",
    sourceText: clean(properties.sourceText),
    sourceUrl: clean(properties.sourceUrl),
    sourceFields,
    rawProperties,
    reviewNotes: clean(properties.reviewNotes),
    isPubliclyVisible,
    classificationReason:
      clean(properties.classificationReason) || classification.classificationReason,
    matchedPositiveKeywords:
      properties.matchedPositiveKeywords ?? classification.matchedPositiveKeywords ?? [],
    matchedStrongPositivePhrases:
      properties.matchedStrongPositivePhrases ??
      classification.matchedStrongPositivePhrases ??
      [],
    matchedNegativeKeywords:
      properties.matchedNegativeKeywords ?? classification.matchedNegativeKeywords ?? [],
    createdAt: clean(properties.createdAt),
    updatedAt: clean(properties.updatedAt),
    areaSqm:
      typeof properties.areaSqm === "number"
        ? properties.areaSqm
        : typeof properties.Shape_Area === "number"
          ? properties.Shape_Area
          : undefined,
    assetId: clean(properties.assetId) || undefined,
    rawFeature: {
      ...feature,
      id,
      geometry,
      properties: {
        ...properties,
        id,
        sourceLayer,
        sourceObjectId,
        name: getSpaceDisplayName(properties),
        status: verificationStatus,
        verificationStatus,
        confidence,
        centroid,
        center: centroid,
        isPubliclyVisible,
        classificationReason:
          clean(properties.classificationReason) || classification.classificationReason,
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
      sourceLayer: space.sourceLayer,
      sourceObjectId: space.sourceObjectId,
      name: space.name,
      displayName: space.name,
      address: space.address,
      city: space.city,
      status: space.verificationStatus,
      verificationStatus: space.verificationStatus,
      kind: space.type,
      type: space.type,
      source: space.source,
      sourceText: space.sourceText,
      sourceUrl: space.sourceUrl,
      centroid: space.centroid,
      center: space.centroid,
      publicRightSummary: space.publicRightSummary,
      entranceInstructions: space.entranceInstructions,
      confidence: space.confidence,
      areaSqm: space.areaSqm,
      assetId: space.assetId,
      sourceFields: space.sourceFields,
      rawProperties: space.rawProperties,
      reviewNotes: space.reviewNotes,
      isPubliclyVisible: space.isPubliclyVisible,
      classificationReason: space.classificationReason,
      matchedPositiveKeywords: space.matchedPositiveKeywords,
      matchedStrongPositivePhrases: space.matchedStrongPositivePhrases,
      matchedNegativeKeywords: space.matchedNegativeKeywords,
      createdAt: space.createdAt,
      updatedAt: space.updatedAt,
    },
  };
}
