import type { Space } from "@/lib/normalizeSpace";

function encodedPoint(space: Space) {
  const [lng, lat] = space.centroid;
  return {
    lng,
    lat,
    label: encodeURIComponent(space.name),
  };
}

export function createNavigationLinks(space: Space) {
  const { lng, lat, label } = encodedPoint(space);
  const latLng = `${lat},${lng}`;

  return {
    googleMaps: `https://www.google.com/maps/search/?api=1&query=${latLng}`,
    waze: `https://waze.com/ul?ll=${latLng}&navigate=yes`,
    appleMaps: `https://maps.apple.com/?ll=${latLng}&q=${label}`,
  };
}

export function spaceDetailUrl(space: Space) {
  return `/spaces/${encodeURIComponent(space.id)}`;
}

export function spaceReportUrl(space: Space) {
  return `/report/${encodeURIComponent(space.id)}`;
}
