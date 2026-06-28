import { existsSync, readFileSync } from "fs";
import { join } from "path";
import {
  normalizeSpaces,
  type RawSpaceFeature,
  type Space,
} from "@/lib/normalizeSpace";
import type { SpacesCollection } from "@/lib/spaces";

function readCollection(): SpacesCollection {
  const publicPath = join(
    process.cwd(),
    "public",
    "data",
    "public",
    "public-spaces.geojson",
  );
  const fallbackPath = join(process.cwd(), "public", "data", "public-spaces.geojson");
  const filePath = existsSync(publicPath) ? publicPath : fallbackPath;
  return JSON.parse(readFileSync(filePath, "utf8")) as SpacesCollection;
}

function readResearchCollections(): SpacesCollection[] {
  const researchPath = join(
    process.cwd(),
    "public",
    "data",
    "research",
    "research-candidates.geojson",
  );

  if (!existsSync(researchPath)) {
    return [];
  }

  return [JSON.parse(readFileSync(researchPath, "utf8")) as SpacesCollection];
}

export function getAllSpaces(): Space[] {
  const collections = [readCollection(), ...readResearchCollections()];
  const seen = new Set<string>();

  return collections
    .flatMap((collection) => normalizeSpaces(collection.features as RawSpaceFeature[]))
    .filter((space) => {
      if (seen.has(space.id)) {
        return false;
      }
      seen.add(space.id);
      return true;
    });
}

export function getSpaceById(id: string): Space | undefined {
  return getAllSpaces().find((space) => space.id === id);
}
