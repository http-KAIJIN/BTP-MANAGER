export default function Home() {
  const kpis = [
    { label: "Active projects", value: "12", detail: "3 companies" },
    { label: "Total commitments", value: "4 850 000 MAD", detail: "Across active projects" },
    { label: "Total paid", value: "2 940 000 MAD", detail: "60.6% paid" },
    { label: "Remaining", value: "1 910 000 MAD", detail: "Needs follow-up", warning: true },
  ];

  const projects = [
    { name: "Jouhara 226", city: "Casablanca", progress: "65%", remaining: "350 000 MAD" },
    { name: "Futur Diar R+4", city: "Rabat", progress: "42%", remaining: "720 000 MAD" },
    { name: "Alpha Résidence", city: "Marrakech", progress: "78%", remaining: "180 000 MAD" },
  ];

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-950">
      <div className="mx-auto flex min-h-dvh max-w-7xl flex-col lg:flex-row">
        <aside className="hidden w-72 border-r border-slate-200 bg-slate-950 p-6 text-white lg:block">
          <div className="text-xl font-bold tracking-tight">BTP Manager</div>
          <div className="mt-1 text-sm text-slate-300">Construction ERP</div>
          <nav className="mt-10 space-y-2 text-sm font-medium">
            {[
              "Dashboard",
              "Companies",
              "Projects",
              "Intervenants",
              "Suppliers",
              "Commitments",
              "Payments",
              "Expenses",
              "Construction",
              "Reports",
            ].map((item) => (
              <div
                className={`rounded-xl px-4 py-3 ${item === "Dashboard" ? "bg-orange-500 text-white" : "text-slate-300"}`}
                key={item}
              >
                {item}
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Executive dashboard</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight">BTP Manager ERP</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Centralize projects, commitments, payments, expenses, and construction progress across all companies.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">All companies</button>
                <button className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">New project</button>
              </div>
            </div>
          </header>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" key={kpi.label}>
                <div className="text-sm font-medium text-slate-500">{kpi.label}</div>
                <div className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{kpi.value}</div>
                <div className={kpi.warning ? "mt-2 text-sm font-medium text-amber-700" : "mt-2 text-sm text-slate-500"}>{kpi.detail}</div>
              </article>
            ))}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Financial overview</h2>
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">MAD</span>
              </div>
              <div className="mt-6 space-y-4">
                {["Commitments", "Paid", "Remaining", "Expenses"].map((label, index) => (
                  <div key={label}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-slate-600">{label}</span>
                      <span className="font-semibold">{["4 850 000", "2 940 000", "1 910 000", "1 320 000"][index]} MAD</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100">
                      <div className="h-3 rounded-full bg-orange-500" style={{ width: ["100%", "61%", "39%", "27%"][index] }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">Alerts</h2>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="font-semibold text-amber-900">High remaining balance</div>
                  <p className="mt-1 text-sm text-amber-800">Futur Diar R+4 has 720 000 MAD remaining.</p>
                </div>
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="font-semibold text-red-900">Blocked construction phase</div>
                  <p className="mt-1 text-sm text-red-800">One project has a blocked phase requiring review.</p>
                </div>
              </div>
            </article>
          </section>

          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Active projects</h2>
              <button className="text-sm font-semibold text-orange-600">View all</button>
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              {projects.map((project) => (
                <div className="grid gap-3 border-b border-slate-200 p-4 last:border-b-0 sm:grid-cols-4 sm:items-center" key={project.name}>
                  <div>
                    <div className="font-semibold">{project.name}</div>
                    <div className="text-sm text-slate-500">{project.city}</div>
                  </div>
                  <div className="text-sm text-slate-600">Progress: <span className="font-semibold text-slate-950">{project.progress}</span></div>
                  <div className="text-sm text-slate-600">Remaining: <span className="font-semibold text-amber-700">{project.remaining}</span></div>
                  <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Open</button>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
