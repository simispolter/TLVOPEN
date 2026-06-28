import type { Space } from "@/lib/normalizeSpace";

function encodedPoint(space: Space) {
  const [lng, lat] = space.centroid ?? [0, 0];
  return {
    lng,
    lat,
    label: encodeURIComponent(space.name),
  };
}

export function createNavigationLinks(space: Space) {
  const { lng, lat, label } = encodedPoint(space);
  const latLng = `${lat},${lng}`;
  const searchQuery = encodeURIComponent(
    [space.name, space.address, space.city].filter(Boolean).join(", "),
  );

  return {
    googleMaps: space.centroid
      ? `https://www.google.com/maps/search/?api=1&query=${latLng}`
      : `https://www.google.com/maps/search/?api=1&query=${searchQuery}`,
    waze: space.centroid
      ? `https://waze.com/ul?ll=${latLng}&navigate=yes`
      : `https://waze.com/ul?q=${searchQuery}`,
    appleMaps: space.centroid
      ? `https://maps.apple.com/?ll=${latLng}&q=${label}`
      : `https://maps.apple.com/?q=${searchQuery}`,
  };
}

export function spaceDetailUrl(space: Space) {
  return `/spaces/${encodeURIComponent(space.id)}`;
}

export function spaceReportUrl(space: Space) {
  return `/report/${encodeURIComponent(space.id)}`;
}
