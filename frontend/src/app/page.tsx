export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-72 border-r border-slate-200 bg-white p-6">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              QMS Platform
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">
              Quality Control Hub
            </h1>
          </div>

          <nav className="space-y-2">
            <a className="block rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white">
              Dashboard
            </a>
            <a className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Documents
            </a>
            <a className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Revisions
            </a>
            <a className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Approvals
            </a>
            <a className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Standards
            </a>
            <a className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
              NCR / CAPA
            </a>
          </nav>
        </aside>

        <section className="flex-1 p-8">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Document Control MVP
              </p>
              <h2 className="mt-1 text-3xl font-bold text-slate-950">
                QMS Dashboard
              </h2>
            </div>

            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              Backend: Ready to connect
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Controlled Documents
              </p>
              <p className="mt-3 text-4xl font-bold text-slate-950">0</p>
              <p className="mt-2 text-sm text-slate-500">
                Documents tracked in the QMS.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Revisions in Review
              </p>
              <p className="mt-3 text-4xl font-bold text-slate-950">0</p>
              <p className="mt-2 text-sm text-slate-500">
                Drafts currently waiting for approval.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Effective Revisions
              </p>
              <p className="mt-3 text-4xl font-bold text-slate-950">0</p>
              <p className="mt-2 text-sm text-slate-500">
                Active controlled revisions.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-950">
                  Document Control Workflow
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  The current MVP workflow controls document identity, revision history,
                  approvals, and effective release status.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-950">1. Create Document</p>
                <p className="mt-2 text-sm text-slate-500">
                  Register the controlled document record.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-950">2. Create Revision</p>
                <p className="mt-2 text-sm text-slate-500">
                  Add revision history and change summary.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-950">3. Approve</p>
                <p className="mt-2 text-sm text-slate-500">
                  Capture review and approval decisions.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-950">4. Make Effective</p>
                <p className="mt-2 text-sm text-slate-500">
                  Set the current controlled revision.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}