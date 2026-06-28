import type { SpaceConfidence, VerificationStatus } from "@/lib/status";

export type ClassificationResult = {
  verificationStatus: VerificationStatus;
  confidence: SpaceConfidence;
  matchedPositiveKeywords: string[];
  matchedStrongPositivePhrases: string[];
  matchedNegativeKeywords: string[];
  classificationReason: string;
  isPubliclyVisible: boolean;
};

export const positiveKeywords = [
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

export const strongPositivePhrases = [
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

export const negativeKeywords = [
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

function cleanText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map(cleanText).join(" ");
  }

  return String(value).replace(/\s+/g, " ").trim();
}

function allText(rawProperties: Record<string, unknown>) {
  return Object.values(rawProperties)
    .map(cleanText)
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("he-IL");
}

function matches(text: string, phrases: string[]) {
  return phrases.filter((phrase) =>
    text.includes(phrase.toLocaleLowerCase("he-IL")),
  );
}

function hasOnlyParcelReference(text: string) {
  const hasParcel = /(גוש|חלקה|מגרש|parcel|block|lot)/i.test(text);
  const hasLetters = /[א-תa-z]/i.test(text);
  return hasParcel && hasLetters && text.length < 180;
}

export function classifySpace(
  rawProperties: Record<string, unknown> = {},
): ClassificationResult {
  const text = allText(rawProperties);
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
