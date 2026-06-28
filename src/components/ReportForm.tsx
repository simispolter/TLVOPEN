"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Send } from "lucide-react";
import type { Space } from "@/lib/normalizeSpace";

const reportOptions = [
  "פתוח",
  "חסום",
  "שומר מנע כניסה",
  "שער נעול",
  "לא מצאתי כניסה",
  "שילוט חסר או מטעה",
  "אחר",
];

type ReportFormProps = {
  space: Space;
};

export function ReportForm({ space }: ReportFormProps) {
  const [selected, setSelected] = useState(reportOptions[0]);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-lg bg-white p-5 text-center ring-1 ring-ink/10">
        <CheckCircle2 className="mx-auto h-10 w-10 text-open" aria-hidden="true" />
        <h1 className="mt-3 text-xl font-black text-ink">הדיווח נקלט מקומית</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-concrete">
          בשלב זה אין שמירה לשרת. הטופס נועד להמחיש את זרימת הדיווח לפני חיבור תשתית נתונים.
        </p>
        <Link
          href={`/spaces/${encodeURIComponent(space.id)}`}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-mapblue px-5 text-sm font-black text-white"
        >
          חזרה לפרטים
        </Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <div className="rounded-lg bg-white p-4 ring-1 ring-ink/10">
        <h1 className="text-xl font-black leading-7 text-ink">דווח על בעיה</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-concrete">
          {space.name}
        </p>
      </div>

      <fieldset className="rounded-lg bg-white p-4 ring-1 ring-ink/10">
        <legend className="mb-3 text-sm font-black text-ink">
          מה ראית במקום?
        </legend>
        <div className="grid gap-2">
          {reportOptions.map((option) => (
            <label
              key={option}
              className="flex min-h-12 items-center gap-3 rounded-lg bg-background px-3 text-sm font-extrabold text-ink ring-1 ring-ink/10"
            >
              <input
                type="radio"
                name="report"
                value={option}
                checked={selected === option}
                onChange={() => setSelected(option)}
                className="h-4 w-4 accent-mapblue"
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block rounded-lg bg-white p-4 ring-1 ring-ink/10">
        <span className="text-sm font-black text-ink">הערה חופשית</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={5}
          placeholder="מה חסם את הכניסה? איפה ניסית להיכנס? האם היה שילוט?"
          className="mt-3 w-full rounded-lg border border-ink/10 bg-background p-3 text-sm font-semibold leading-6 outline-none focus:border-mapblue"
        />
      </label>

      <button
        type="submit"
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-mapblue px-5 text-sm font-black text-white shadow-float"
      >
        <Send className="h-5 w-5" aria-hidden="true" />
        שלח דיווח מקומי
      </button>
    </form>
  );
}
