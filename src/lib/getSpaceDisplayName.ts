const parcelOnlyPattern =
  /^(?:[\s,:;/-]*(?:גוש|חלקה|מגרש|תא שטח|block|parcel|lot)\s*\d+)+[\s,:;/-]*$/i;

function clean(value?: string | number | null) {
  return value === null || value === undefined
    ? ""
    : String(value).replace(/\s+/g, " ").trim();
}

export function isTechnicalParcelName(value?: string | number | null) {
  const text = clean(value);
  if (!text) {
    return false;
  }

  return parcelOnlyPattern.test(text) || /^גוש\s+\d+\s+חלקה\s+\d+/.test(text);
}

export function getSpaceDisplayName(
  properties: Record<string, unknown> = {},
  fallback = "מועמד לבדיקה",
) {
  const candidates = [
    properties.curatedName,
    properties.displayName,
    properties.name,
    properties.title,
    properties.address,
    properties.street,
    properties.streetName,
    properties.rehov,
  ];

  for (const candidate of candidates) {
    const value = clean(candidate as string | number | null);
    if (value && !isTechnicalParcelName(value)) {
      return value;
    }
  }

  return fallback;
}
