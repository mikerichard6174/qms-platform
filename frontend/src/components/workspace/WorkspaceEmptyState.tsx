type WorkspaceEmptyStateProps = {
  title: string;
  description: string;
};

export function WorkspaceEmptyState({
  title,
  description,
}: WorkspaceEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p className="font-semibold text-slate-950">{title}</p>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}