import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import {
  countByStatus,
  loadRawFeatures,
  statuses,
} from "./classify-tlv-candidates.mjs";

const processedPath = "public/data/processed/tlv-public-access-candidates.geojson";
const publicPath = "public/data/public/public-spaces.geojson";
const researchPath = "public/data/research/research-candidates.geojson";
const curatedPath = "public/data/curated-public-spaces.json";

function ensureDir(path) {
  mkdirSync(dirname(resolve(path)), { recursive: true });
}

function collection(features, extra = {}) {
  return {
    type: "FeatureCollection",
    generatedAt: new Date().toISOString(),
    ...extra,
    features,
  };
}

function curatedToFeature(record) {
  return {
    type: "Feature",
    id: record.id,
    geometry: record.geometry ?? null,
    properties: {
      ...record,
      status: record.verificationStatus,
      sourceLayer: record.sourceLayer ?? "manual-curated",
      sourceObjectId: record.sourceObjectId ?? record.id,
      sourceFields: record.sourceFields ?? {},
      rawProperties: record.rawProperties ?? record,
      classificationReason:
        record.classificationReason ??
        "רשומה ידנית שנוספה כמקרה עוגן למחקר והעשרה עתידית.",
      matchedPositiveKeywords: record.matchedPositiveKeywords ?? [],
      matchedStrongPositivePhrases: record.matchedStrongPositivePhrases ?? [],
      matchedNegativeKeywords: record.matchedNegativeKeywords ?? [],
      createdAt: record.createdAt ?? new Date().toISOString(),
      updatedAt: record.updatedAt ?? new Date().toISOString(),
    },
  };
}

function readCurated() {
  return JSON.parse(readFileSync(curatedPath, "utf8")).map(curatedToFeature);
}

function writeGeoJson(path, features, extra) {
  ensureDir(path);
  writeFileSync(path, `${JSON.stringify(collection(features, extra), null, 2)}\n`);
}

const classified = loadRawFeatures();
const curated = readCurated();
const allClassified = [...classified, ...curated];

const publicFeatures = allClassified.filter((feature) => {
  const status = feature.properties?.verificationStatus;
  if (status === "verified_public_access" || status === "field_verified_open") {
    return true;
  }

  if (status === "reported_blocked") {
    return feature.properties?.underlyingPublicRight === true;
  }

  return false;
});

const researchFeatures = allClassified.filter((feature) =>
  ["candidate_likely_public", "candidate_raw"].includes(
    feature.properties?.verificationStatus,
  ),
);

const counts = countByStatus(allClassified);
const summary = {
  totalRawFeatures: classified.length,
  ...Object.fromEntries(statuses.map((status) => [status, counts[status] ?? 0])),
  publicFacingCount: publicFeatures.length,
  researchOnlyCount: researchFeatures.length,
};

writeGeoJson(processedPath, allClassified, { summary });
writeGeoJson(publicPath, publicFeatures, {
  summary,
  visibilityRule:
    "Includes only verified_public_access, field_verified_open, and reported_blocked with an underlying public right.",
});
writeGeoJson(researchPath, researchFeatures, {
  summary,
  warning:
    "Research candidates are not a verified list of spaces open to the public.",
});

console.log(JSON.stringify(summary, null, 2));
