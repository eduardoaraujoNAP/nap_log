import type { ActivityStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: ActivityStatus }) {
  return <span className={`status status-${status.toLowerCase().replace(" ", "-").replace("ç", "c").replace("í", "i")}`}><i/>{status}</span>;
}
