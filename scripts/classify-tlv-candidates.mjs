import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";

export const rawSources = [
  {
    sourceLayer: "tlv-easements-with-plan",
    label: "זיקות הנאה עם תשריט",
    path: "public/data/raw/tlv-easements-with-plan.geojson",
  },
  {
    sourceLayer: "tlv-easements-without-plan",
    label: "זיקות הנאה ללא תשריט",
    path: "public/data/raw/tlv-easements-without-plan.geojson",
  },
  {
    sourceLayer: "tlv-landuse-detailed",
    label: "מגרשי ייעודי קרקע מפורט",
    path: "public/data/raw/tlv-landuse-detailed.geojson",
    localFilter: (properties) =>
      allText(properties).includes('שפ"פ') ||
      allText(properties).includes("שטח פרטי פתוח") ||
      allText(properties).includes("פרטי פתוח"),
  },
];

export const statuses = [
  "candidate_raw",
  "candidate_likely_public",
  "verified_public_access",
  "field_verified_open",
  "reported_blocked",
  "excluded",
];

const positiveKeywords = [
  "ציבור",
  "הציבור",
  "לציבור",
  "הולכי רגל",
  "מעבר",
  "שהייה",
  "שימוש ציבורי",
  "גישה חופשית",
  "בכל שעות היום",
  "בכל ימות השבוע",
  "24/7",
  'שפ"פ',
  "שטח פרטי פתוח",
  "רחבה ציבורית",
  "אטריום",
  "קולונדה",
  "מעבר מקורה",
];

const strongPositivePhrases = [
  "זיקת הנאה לציבור",
  "זיקת הנאה לטובת הציבור",
  "זיקת הנאה למעבר הציבור",
  "זיקת הנאה למעבר הולכי רגל",
  "זיקת הנאה למעבר ושהיית הציבור",
  "מעבר ושהיית הציבור",
  "שהיית הציבור",
  "גישה חופשית לשימוש ציבורי",
  "ייפתח כמרחב ציבורי",
  "מרחב ציבורי פתוח",
  "פתוח לציבור",
  "לשימוש הציבור",
  "בכל שעות היום ובכל ימות השבוע",
];

const negativeKeywords = [
  "תשתית",
  "תשתיות",
  "תחזוקה",
  "ביוב",
  "ניקוז",
  "חשמל",
  "חברת חשמל",
  "מים",
  "בזק",
  "תקשורת",
  "חניה",
  "חניון",
  "רכב",
  "דרך שירות",
  "מעבר רכב",
  "עירייה בלבד",
  "לטובת העירייה",
  "הערת אזהרה",
  "טכני",
  "מתקנים הנדסיים",
  "חדר טרפו",
  "חדר חשמל",
];

const shpaphOnlyPhrases = ['שפ"פ', "שטח פרטי פתוח", "פרטי פתוח"];

function ensureDir(path) {
  mkdirSync(dirname(resolve(path)), { recursive: true });
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

export function allText(properties = {}) {
  return Object.values(properties)
    .map(cleanText)
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("he-IL");
}

function matches(text, phrases) {
  return phrases.filter((phrase) =>
    text.includes(phrase.toLocaleLowerCase("he-IL")),
  );
}

function hasOnlyParcelReference(text) {
  const hasParcel = /(גוש|חלקה|מגרש|parcel|block|lot)/i.test(text);
  const hasLetters = /[א-תa-z]/i.test(text);
  return hasParcel && hasLetters && text.length < 180;
}

export function classifyProperties(properties = {}) {
  const text = allText(properties);
  const matchedStrongPositivePhrases = matches(text, strongPositivePhrases);
  const matchedPositiveKeywords = matches(text, positiveKeywords);
  const matchedNegativeKeywords = matches(text, negativeKeywords);
  const shpaphMatches = matches(text, shpaphOnlyPhrases);
  const hasPublicAccessWording =
    matchedStrongPositivePhrases.length > 0 ||
    matchedPositiveKeywords.some(
      (keyword) => !shpaphOnlyPhrases.includes(keyword),
    );

  if (
    matchedNegativeKeywords.length > 0 &&
    matchedStrongPositivePhrases.length === 0 &&
    matchedPositiveKeywords.length === 0
  ) {
    return {
      verificationStatus: "excluded",
      confidence: "raw_candidate_only",
      matchedPositiveKeywords,
      matchedStrongPositivePhrases,
      matchedNegativeKeywords,
      classificationReason:
        "נמצאו מילות מפתח של תשתית, תחזוקה, רכב או זכות עירונית טכנית ללא ניסוח של גישה ציבורית.",
      isPubliclyVisible: false,
    };
  }

  if (matchedStrongPositivePhrases.length > 0) {
    return {
      verificationStatus: "candidate_likely_public",
      confidence: "official_source_public_wording",
      matchedPositiveKeywords,
      matchedStrongPositivePhrases,
      matchedNegativeKeywords,
      classificationReason:
        "נמצא ניסוח חזק שמרמז על גישה, מעבר או שימוש ציבורי. נדרש אימות לפני הצגה כמרחב ציבורי מאומת.",
      isPubliclyVisible: false,
    };
  }

  if (hasPublicAccessWording) {
    return {
      verificationStatus: "candidate_raw",
      confidence: "keyword_likely_public",
      matchedPositiveKeywords,
      matchedStrongPositivePhrases,
      matchedNegativeKeywords,
      classificationReason:
        "נמצאו מילות מפתח כלליות בלבד. הרשומה נשארת מועמדת למחקר ואינה הוכחה לזכות ציבורית.",
      isPubliclyVisible: false,
    };
  }

  if (shpaphMatches.length > 0) {
    return {
      verificationStatus: "candidate_raw",
      confidence: "raw_candidate_only",
      matchedPositiveKeywords,
      matchedStrongPositivePhrases,
      matchedNegativeKeywords,
      classificationReason:
        'נמצא ניסוח מסוג שפ"פ או שטח פרטי פתוח בלבד, ללא ניסוח מפורש של זכות גישה או שימוש ציבורי.',
      isPubliclyVisible: false,
    };
  }

  if (hasOnlyParcelReference(text)) {
    return {
      verificationStatus: "candidate_raw",
      confidence: "raw_candidate_only",
      matchedPositiveKeywords,
      matchedStrongPositivePhrases,
      matchedNegativeKeywords,
      classificationReason:
        "הרשומה כוללת בעיקר הפניה לגוש, חלקה או מגרש, ללא ניסוח ציבורי מספיק.",
      isPubliclyVisible: false,
    };
  }

  return {
    verificationStatus: "candidate_raw",
    confidence: "raw_candidate_only",
    matchedPositiveKeywords,
    matchedStrongPositivePhrases,
    matchedNegativeKeywords,
    classificationReason:
      "לא נמצאה אינדיקציה מספקת לזכות ציבורית. הרשומה נשמרת כמועמדת גולמית לבדיקה.",
    isPubliclyVisible: false,
  };
}

function sourceObjectId(properties, index) {
  return (
    properties.OBJECTID ??
    properties.objectId ??
    properties.ObjectID ??
    properties.FID ??
    properties.id ??
    index + 1
  );
}

function displayName(properties) {
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

  for (const value of candidates) {
    const text = cleanText(value);
    if (text && !/^(?:גוש|חלקה|מגרש|תא שטח|\d|\s|-|,)+$/i.test(text)) {
      return text;
    }
  }

  return "מועמד לבדיקה";
}

export function classifyFeature(feature, source, index) {
  const rawProperties = feature.properties ?? {};
  const classification = classifyProperties(rawProperties);
  const objectId = sourceObjectId(rawProperties, index);
  const id = `${source.sourceLayer}-${objectId}`;

  return {
    ...feature,
    id,
    properties: {
      id,
      sourceLayer: source.sourceLayer,
      sourceLayerLabel: source.label,
      sourceObjectId: String(objectId),
      name: displayName(rawProperties),
      city: "תל אביב-יפו",
      type: source.label,
      source: "עיריית תל אביב-יפו - GIS",
      sourceText: allText(rawProperties),
      sourceUrl: "",
      sourceFields: rawProperties,
      rawProperties,
      ...classification,
      publicRightSummary:
        "רשומת מקור גולמית ממאגר עירוני. נדרש אימות מול מקור תכנוני או בדיקת שטח לפני קביעה שהמקום פתוח לציבור.",
      entranceInstructions: "טרם אומתו הוראות כניסה.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

export function loadRawFeatures() {
  return rawSources.flatMap((source) => {
    if (!existsSync(source.path)) {
      console.warn(`Missing raw source: ${source.path}`);
      return [];
    }

    const collection = JSON.parse(readFileSync(source.path, "utf8"));
    const features = collection.features ?? [];
    return features
      .filter((feature) =>
        source.localFilter ? source.localFilter(feature.properties ?? {}) : true,
      )
      .map((feature, index) => classifyFeature(feature, source, index));
  });
}

export function countByStatus(features) {
  return Object.fromEntries(
    statuses.map((status) => [
      status,
      features.filter(
        (feature) => feature.properties?.verificationStatus === status,
      ).length,
    ]),
  );
}

export function writeClassifiedCandidates(outputPath) {
  const features = loadRawFeatures();
  ensureDir(outputPath);
  writeFileSync(
    outputPath,
    `${JSON.stringify(
      {
        type: "FeatureCollection",
        generatedAt: new Date().toISOString(),
        features,
        summary: countByStatus(features),
      },
      null,
      2,
    )}\n`,
  );
  return features;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const outputPath = "public/data/processed/tlv-public-access-candidates.geojson";
  const features = writeClassifiedCandidates(outputPath);
  console.log(`Classified ${features.length} candidates into ${outputPath}`);
  console.log(JSON.stringify(countByStatus(features), null, 2));
}
