type WorkspaceStatusBadgeProps = {
  status: string;
};

function statusClass(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "on_hold":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "closed":
      return "bg-slate-200 text-slate-700 border-slate-300";

    case "draft":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function displayLabel(status: string): string {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function WorkspaceStatusBadge({
  status,
}: WorkspaceStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClass(
        status,
      )}`}
    >
      {displayLabel(status)}
    </span>
  );
}