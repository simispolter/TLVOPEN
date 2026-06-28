import { readFileSync } from "fs";
import { join } from "path";
import {
  normalizeSpaces,
  type RawSpaceFeature,
  type Space,
} from "@/lib/normalizeSpace";
import type { SpacesCollection } from "@/lib/spaces";

function readCollection(): SpacesCollection {
  const filePath = join(process.cwd(), "public", "data", "public-spaces.geojson");
  return JSON.parse(readFileSync(filePath, "utf8")) as SpacesCollection;
}

export function getAllSpaces(): Space[] {
  const collection = readCollection();
  return normalizeSpaces(collection.features as RawSpaceFeature[]);
}

export function getSpaceById(id: string): Space | undefined {
  return getAllSpaces().find((space) => space.id === id);
}
