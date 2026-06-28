import type { Space } from "@/lib/normalizeSpace";

export async function shareSpace(space: Space) {
  const url = `${window.location.origin}/spaces/${encodeURIComponent(space.id)}`;
  const data = {
    title: space.name,
    text: "פתוח לציבור",
    url,
  };

  if (navigator.share) {
    await navigator.share(data);
    return "shared" as const;
  }

  await navigator.clipboard.writeText(url);
  return "copied" as const;
}
