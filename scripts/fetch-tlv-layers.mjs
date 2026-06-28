import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";

const layers = [
  {
    id: 750,
    name: "tlv-easements-with-plan",
    label: "זיקות הנאה עם תשריט",
    url: "https://gisn.tel-aviv.gov.il/arcgis/rest/services/IView2/MapServer/750/query",
    output: "public/data/raw/tlv-easements-with-plan.geojson",
    fallback: "public/data/public-spaces.geojson",
  },
  {
    id: 749,
    name: "tlv-easements-without-plan",
    label: "זיקות הנאה ללא תשריט",
    url: "https://gisn.tel-aviv.gov.il/arcgis/rest/services/IView2/MapServer/749/query",
    output: "public/data/raw/tlv-easements-without-plan.geojson",
  },
  {
    id: 837,
    name: "tlv-landuse-detailed",
    label: "מגרשי ייעודי קרקע מפורט",
    url: "https://gisn.tel-aviv.gov.il/arcgis/rest/services/IView2/MapServer/837/query",
    output: "public/data/raw/tlv-landuse-detailed.geojson",
    persistFilter: (properties) => {
      const text = allText(properties);
      return (
        text.includes('שפ"פ') ||
        text.includes("שטח פרטי פתוח") ||
        text.includes("פרטי פתוח")
      );
    },
  },
];

const pageSize = 2000;
const requestTimeoutMs = 20000;

function ensureDir(path) {
  mkdirSync(dirname(resolve(path)), { recursive: true });
}

function featureCollection(features, metadata = {}) {
  return {
    type: "FeatureCollection",
    ...metadata,
    features,
  };
}

function cleanText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return Object.values(value).map(cleanText).join(" ");
  }

  return String(value).replace(/\s+/g, " ").trim();
}

function allText(properties = {}) {
  return Object.values(properties)
    .map(cleanText)
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("he-IL");
}

function buildUrl(layer, offset) {
  const url = new URL(layer.url);
  url.searchParams.set("where", "1=1");
  url.searchParams.set("outFields", "*");
  url.searchParams.set("f", "geojson");
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("resultOffset", String(offset));
  url.searchParams.set("resultRecordCount", String(pageSize));
  return url;
}

async function fetchLayer(layer) {
  const features = [];
  let totalFetched = 0;
  let offset = 0;
  let page = 0;

  while (true) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    const response = await fetch(buildUrl(layer, offset), {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message ?? JSON.stringify(data.error));
    }

    const pageFeatures = data.features ?? [];
    totalFetched += pageFeatures.length;
    features.push(
      ...(layer.persistFilter
        ? pageFeatures.filter((feature) =>
            layer.persistFilter(feature.properties ?? {}),
          )
        : pageFeatures),
    );
    page += 1;
    console.log(
      `Fetched page ${page} for ${layer.name}: ${pageFeatures.length} features`,
    );

    if (!data.exceededTransferLimit && pageFeatures.length < pageSize) {
      break;
    }

    if (pageFeatures.length === 0) {
      break;
    }

    offset += pageSize;
  }

  return featureCollection(features, {
    sourceLayer: layer.name,
    sourceLayerId: layer.id,
    sourceLayerLabel: layer.label,
    fetchedAt: new Date().toISOString(),
    totalFetched,
    persistedAfterLocalFilter: features.length,
  });
}

function writeFallback(layer, reason) {
  if (existsSync(layer.output)) {
    console.warn(`Keeping existing ${layer.output}. Fetch failed: ${reason}`);
    return;
  }

  if (layer.fallback && existsSync(layer.fallback)) {
    const fallback = JSON.parse(readFileSync(layer.fallback, "utf8"));
    const features = (fallback.features ?? []).map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        sourceLayer: layer.name,
        sourceObjectId:
          feature.properties?.sourceObjectId ??
          feature.properties?.objectId ??
          feature.properties?.OBJECTID ??
          feature.id,
      },
    }));
    ensureDir(layer.output);
    writeFileSync(
      layer.output,
      `${JSON.stringify(
        featureCollection(features, {
          sourceLayer: layer.name,
          sourceLayerId: layer.id,
          sourceLayerLabel: layer.label,
          fetchedAt: null,
          fetchFailedAt: new Date().toISOString(),
          fetchFailureReason: reason,
          fallbackFrom: layer.fallback,
        }),
        null,
        2,
      )}\n`,
    );
    console.warn(`Wrote fallback raw data to ${layer.output}.`);
    return;
  }

  ensureDir(layer.output);
  writeFileSync(
    layer.output,
    `${JSON.stringify(
      featureCollection([], {
        sourceLayer: layer.name,
        sourceLayerId: layer.id,
        sourceLayerLabel: layer.label,
        fetchedAt: null,
        fetchFailedAt: new Date().toISOString(),
        fetchFailureReason: reason,
      }),
      null,
      2,
    )}\n`,
  );
  console.warn(`Wrote empty raw data to ${layer.output}.`);
}

for (const layer of layers) {
  try {
    const collection = await fetchLayer(layer);
    ensureDir(layer.output);
    writeFileSync(layer.output, `${JSON.stringify(collection, null, 2)}\n`);
    console.log(`Fetched ${collection.features.length} features: ${layer.output}`);
  } catch (error) {
    writeFallback(layer, error instanceof Error ? error.message : String(error));
  }
}
