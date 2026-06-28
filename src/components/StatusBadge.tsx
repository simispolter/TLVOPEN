import type { SpaceStatus } from "@/lib/spaces";

const statusMeta: Record<
  SpaceStatus,
  {
    label: string;
    className: string;
  }
> = {
  open: {
    label: "פתוח בפועל",
    className: "bg-open/12 text-open ring-open/25",
  },
  official: {
    label: "רשום עירוני",
    className: "bg-official/18 text-ink ring-official/35",
  },
  problem: {
    label: "דורש בדיקה",
    className: "bg-problem/12 text-problem ring-problem/25",
  },
  blocked: {
    label: "חשוד כחסום",
    className: "bg-blocked/12 text-blocked ring-blocked/25",
  },
};

type StatusBadgeProps = {
  status: SpaceStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const meta = statusMeta[status];

  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-bold ring-1 ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
