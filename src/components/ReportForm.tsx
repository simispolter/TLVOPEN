"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Send } from "lucide-react";
import type { Space } from "@/lib/normalizeSpace";

const questions = [
  "האם הצלחת להיכנס?",
  "האם המקום היה חסום?",
  "האם שומר או גורם אחר מנע כניסה?",
  "האם יש שילוט שמבהיר שהמקום פתוח לציבור?",
  "האם יש שילוט שמרתיע כניסה?",
  "האם הכניסה ברורה?",
];

const answers = ["כן", "לא", "לא בטוח"];

type ReportFormProps = {
  space: Space;
};

export function ReportForm({ space }: ReportFormProps) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-lg bg-white p-5 text-center ring-1 ring-ink/10">
        <CheckCircle2 className="mx-auto h-10 w-10 text-open" aria-hidden="true" />
        <h1 className="mt-3 text-xl font-black text-ink">הדיווח נקלט מקומית</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-concrete">
          בשלב זה אין שמירה לשרת. הדיווח לא נשלח למסד נתונים ולא יוצר חשבון משתמש.
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
        <h1 className="text-xl font-black leading-7 text-ink">דווח על מצב בשטח</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-concrete">
          {space.name}
        </p>
        <p className="mt-2 text-xs font-bold leading-5 text-concrete">
          הטופס מקומי בלבד בשלב זה ונועד לתכנן את תהליך האימות.
        </p>
      </div>

      <div className="space-y-3">
        {questions.map((question) => (
          <fieldset
            key={question}
            className="rounded-lg bg-white p-4 ring-1 ring-ink/10"
          >
            <legend className="mb-3 text-sm font-black text-ink">
              {question}
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {answers.map((answer) => (
                <label
                  key={answer}
                  className={`flex min-h-11 items-center justify-center rounded-full px-3 text-sm font-extrabold ring-1 ${
                    responses[question] === answer
                      ? "bg-mapblue text-white ring-mapblue"
                      : "bg-background text-ink ring-ink/10"
                  }`}
                >
                  <input
                    type="radio"
                    name={question}
                    value={answer}
                    checked={responses[question] === answer}
                    onChange={() =>
                      setResponses((current) => ({
                        ...current,
                        [question]: answer,
                      }))
                    }
                    className="sr-only"
                  />
                  {answer}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <label className="block rounded-lg bg-white p-4 ring-1 ring-ink/10">
        <span className="text-sm font-black text-ink">הערה חופשית</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={5}
          placeholder="איפה ניסית להיכנס? מה חסם? האם היה שילוט או אדם במקום?"
          className="mt-3 w-full rounded-lg border border-ink/10 bg-background p-3 text-sm font-semibold leading-6 outline-none focus:border-mapblue"
        />
      </label>

      <button
        type="submit"
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-mapblue px-5 text-sm font-black text-white shadow-float"
      >
        <Send className="h-5 w-5" aria-hidden="true" />
        שמור אישור מקומי
      </button>
    </form>
  );
}
