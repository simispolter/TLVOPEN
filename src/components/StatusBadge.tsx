import {
  CircleCheck,
  CircleHelp,
  FileSearch,
  FlaskConical,
  Lock,
  OctagonAlert,
} from "lucide-react";
import { statusMeta, type SpaceStatus } from "@/lib/status";

type StatusBadgeProps = {
  status: SpaceStatus;
  showIcon?: boolean;
};

const icons = {
  CircleCheck,
  FileSearch,
  CircleHelp,
  OctagonAlert,
  Lock,
  FlaskConical,
};

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const meta = statusMeta[status];
  const Icon = icons[meta.icon];

  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${meta.badgeClassName}`}
      title={meta.description}
    >
      {showIcon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {meta.label}
    </span>
  );
}
