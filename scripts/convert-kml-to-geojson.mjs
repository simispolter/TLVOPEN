import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";

const inputPath = resolve("work/gis_140334/export.kml");
const outputPath = resolve("public/data/public-spaces.geojson");

function extract(pattern, text) {
  const match = text.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function decodeHtml(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function parseDescription(description) {
  const lines = decodeHtml(description)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const values = {};
  for (const line of lines) {
    const [rawKey, ...rest] = line.split(" - ");
    if (!rawKey || rest.length === 0) {
      continue;
    }

    values[rawKey.trim()] = rest.join(" - ").trim().replace(/\s+/g, " ");
  }

  return values;
}

function parseRing(coordinatesText) {
  const coordinates = coordinatesText
    .trim()
    .split(/\s+/)
    .map((point) => {
      const [lng, lat] = point.split(",").map(Number);
      return [lng, lat];
    })
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));

  if (coordinates.length > 2) {
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coordinates.push([...first]);
    }
  }

  return coordinates;
}

function centerOfPolygon(polygons) {
  const points = polygons.flat(2);
  const total = points.reduce(
    (acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat],
    [0, 0],
  );

  return [total[0] / points.length, total[1] / points.length];
}

const kml = readFileSync(inputPath, "utf8");
const placemarks = kml.match(/<Placemark[\s\S]*?<\/Placemark>/g) ?? [];

const features = placemarks.flatMap((placemark, index) => {
  const name = decodeHtml(extract(/<name>([\s\S]*?)<\/name>/, placemark));
  const description = extract(
    /<description>([\s\S]*?)<\/description>/,
    placemark,
  );
  const values = parseDescription(description);
  const polygonBlocks = placemark.match(/<Polygon[\s\S]*?<\/Polygon>/g) ?? [];
  const polygons = polygonBlocks
    .map((polygon) => {
      const rings = [...polygon.matchAll(/<coordinates>([\s\S]*?)<\/coordinates>/g)]
        .map((match) => parseRing(match[1]))
        .filter((ring) => ring.length >= 4);

      return rings.length > 0 ? rings : null;
    })
    .filter(Boolean);

  if (polygons.length === 0) {
    return [];
  }

  const objectId = Number(values.OBJECTID ?? index + 1);
  const id = `tlv-easement-${objectId}`;
  const cleanDescription =
    values.teur?.replace(/\s+/g, " ").trim() || name || `שטח ציבורי ${objectId}`;
  const center = centerOfPolygon(polygons);

  return [
    {
      type: "Feature",
      id,
      properties: {
        id,
        objectId,
        assetId: values.id_neches,
        name,
        description: cleanDescription,
        status: "official",
        source: "עיריית תל אביב-יפו - GIS",
        kind: "זיקת הנאה",
        areaSqm: Number(values.Shape_Area) || undefined,
        perimeterM: Number(values.Shape_Length) || undefined,
        importedAt: values.date_import,
        center,
      },
      geometry:
        polygons.length === 1
          ? {
              type: "Polygon",
              coordinates: polygons[0],
            }
          : {
              type: "MultiPolygon",
              coordinates: polygons,
            },
    },
  ];
});

const geojson = {
  type: "FeatureCollection",
  name: "tlv-public-easements",
  generatedFrom: "export_20260628_140334.zip/export.kml",
  generatedAt: new Date().toISOString(),
  features,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(geojson, null, 2)}\n`, "utf8");

console.log(`Wrote ${features.length} features to ${outputPath}`);
