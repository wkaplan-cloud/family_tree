"use client";

import { useEffect, useMemo, useState } from "react";

type Person = {
  id: string;
  name: string;
  alive: boolean;
  email?: string | null;
  notes?: string | null;
  consentStatus?: string | null;
};

type Relationship = {
  id: string;
  leftId: string;
  rightId: string;
  label: string;
};

type GraphResponse = {
  people: Person[];
  relationships: Relationship[];
};

type RelativeForm = {
  name: string;
  relationship: string;
  alive: boolean;
  email: string;
  notes: string;
};

const relationshipOptions = [
  "Mother",
  "Father",
  "Brother",
  "Sister",
  "Son",
  "Daughter",
  "Husband",
  "Wife",
  "Grandmother",
  "Grandfather",
  "Uncle",
  "Aunt",
  "Cousin",
  "Nephew",
  "Niece",
  "Relative"
];

function elasticPath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy) || 1;
  const curve = Math.min(24, distance * 0.08);
  const nx = -dy / distance;
  const ny = dx / distance;
  const cx = mx + nx * curve;
  const cy = my + ny * curve;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

function relationTone(label: string) {
  const value = label.toLowerCase();
  if (value.includes("mother") || value.includes("father") || value.includes("son") || value.includes("daughter")) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  if (value.includes("brother") || value.includes("sister") || value.includes("husband") || value.includes("wife")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (value.includes("grand")) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function getOtherPerson(rel: Relationship, personId: string) {
  return rel.leftId === personId ? rel.rightId : rel.leftId;
}

export default function HomePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAddRelative, setShowAddRelative] = useState(false);
  const [form, setForm] = useState<RelativeForm>({
    name: "",
    relationship: "Brother",
    alive: true,
    email: "",
    notes: ""
  });

  async function loadGraph() {
    try {
      setLoading(true);
      const res = await fetch("/api/graph", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load graph");
      const data: GraphResponse = await res.json();
      setPeople(data.people);
      setRelationships(data.relationships);

      const warren = data.people.find(
        (person) => person.email?.toLowerCase() === "warren@kaplan.co.za" || person.name.toLowerCase() === "warren kaplan"
      );
      setSelectedId((current) => current || warren?.id || data.people[0]?.id || "");
      setError("");
    } catch (err) {
      console.error(err);
      setError("Could not load the family graph.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGraph();
  }, []);

  const selectedPerson = useMemo(
    () => people.find((person) => person.id === selectedId) || null,
    [people, selectedId]
  );

  const selectedRelationships = useMemo(() => {
    if (!selectedPerson) return [];
    return relationships.filter((rel) => rel.leftId === selectedPerson.id || rel.rightId === selectedPerson.id);
  }, [relationships, selectedPerson]);

  const relativeItems = useMemo(() => {
    if (!selectedPerson) return [];

    return selectedRelationships
      .map((rel, index) => {
        const person = people.find((entry) => entry.id === getOtherPerson(rel, selectedPerson.id));
        if (!person) return null;

        const angle = (index / Math.max(selectedRelationships.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const radiusX = 270;
        const radiusY = 180;

        return {
          relationship: rel,
          person,
          x: 500 + Math.cos(angle) * radiusX,
          y: 310 + Math.sin(angle) * radiusY,
        };
      })
      .filter(Boolean) as Array<{
      relationship: Relationship;
      person: Person;
      x: number;
      y: number;
    }>;
  }, [people, selectedPerson, selectedRelationships]);

  async function handleAddRelative() {
    if (!selectedPerson || !form.name.trim()) {
      setError("Please enter a relative name.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const createPersonRes = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          alive: form.alive,
          email: form.alive ? form.email.trim() : "",
          notes: form.notes.trim(),
        }),
      });

      if (!createPersonRes.ok) {
        throw new Error("Could not create relative");
      }

      const created = await createPersonRes.json();

      const createRelationshipRes = await fetch("/api/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leftId: selectedPerson.id,
          rightId: created.person.id,
          label: form.relationship,
        }),
      });

      if (!createRelationshipRes.ok) {
        throw new Error("Could not create relationship");
      }

      setForm({
        name: "",
        relationship: "Brother",
        alive: true,
        email: "",
        notes: "",
      });
      setShowAddRelative(false);
      await loadGraph();
    } catch (err) {
      console.error(err);
      setError("Could not add relative.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        <section className="rounded-[28px] bg-slate-900 p-8 text-white shadow-xl">
          <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs">Kaplan Family Tree</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">Start with one person, then add relatives around them</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            This view is centered on one family member at a time. Click any relative to make them the focus, then keep growing the tree with a simple add-relative flow.
          </p>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Family view</h2>
                  <p className="text-sm text-slate-500">The selected person stays in the middle. Their relatives sit around them.</p>
                </div>
                <button
                  onClick={() => setShowAddRelative(true)}
                  disabled={!selectedPerson}
                  className="h-11 rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white disabled:opacity-50"
                >
                  Add relative
                </button>
              </div>
            </div>

            <div className="relative h-[640px] bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.15),transparent_40%),linear-gradient(to_bottom,#fff,#f8fafc)]">
              {loading ? (
                <div className="flex h-full items-center justify-center text-slate-500">Loading family tree…</div>
              ) : !selectedPerson ? (
                <div className="flex h-full items-center justify-center text-slate-500">No people found yet.</div>
              ) : (
                <>
                  <svg viewBox="0 0 1000 640" className="absolute inset-0 h-full w-full">
                    {relativeItems.map((item) => (
                      <g key={item.relationship.id}>
                        <path
                          d={elasticPath(500, 310, item.x, item.y)}
                          fill="none"
                          stroke="rgba(15,23,42,0.22)"
                          strokeWidth="2.5"
                          strokeDasharray="6 8"
                        />
                        <text x={(500 + item.x) / 2} y={(310 + item.y) / 2 - 8} textAnchor="middle" className="fill-slate-500 text-[11px]">
                          {item.relationship.label}
                        </text>
                      </g>
                    ))}
                  </svg>

                  <button
                    className="absolute left-1/2 top-[310px] min-w-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-900 bg-white px-6 py-4 text-center shadow-xl"
                  >
                    <div className="text-lg font-semibold">{selectedPerson.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{selectedPerson.alive ? "Living relative" : "In memory"}</div>
                  </button>

                  {relativeItems.map((item) => (
                    <button
                      key={item.person.id}
                      onClick={() => setSelectedId(item.person.id)}
                      className="absolute min-w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white px-5 py-3 text-center shadow-lg transition hover:scale-[1.02]"
                      style={{ left: `${(item.x / 1000) * 100}%`, top: `${(item.y / 640) * 100}%` }}
                    >
                      <div className="font-medium text-slate-900">{item.person.name}</div>
                      <div className="mt-1 text-xs text-slate-500">Tap to focus</div>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm text-slate-500">Currently viewing</div>
              <div className="mt-2 text-2xl font-semibold">{selectedPerson?.name || "No one selected"}</div>
              {selectedPerson?.email && <div className="mt-2 text-sm text-slate-600">{selectedPerson.email}</div>}
              {selectedPerson?.notes && (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {selectedPerson.notes}
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-500">Relatives linked here</div>
                  <div className="mt-1 text-3xl font-semibold">{relativeItems.length}</div>
                </div>
                <button
                  onClick={() => setShowAddRelative(true)}
                  disabled={!selectedPerson}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
                >
                  Add relative
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedRelationships.map((rel) => (
                  <span key={rel.id} className={`rounded-full border px-3 py-1 text-xs ${relationTone(rel.label)}`}>
                    {rel.label}
                  </span>
                ))}
                {selectedRelationships.length === 0 && (
                  <div className="text-sm text-slate-500">No relatives linked yet. Add the first one.</div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm text-slate-500">Simple flow</div>
              <ol className="mt-3 space-y-3 text-sm text-slate-700">
                <li>1. Keep Warren Kaplan as the starting point.</li>
                <li>2. Click <span className="font-medium">Add relative</span>.</li>
                <li>3. Choose the relationship and save.</li>
                <li>4. Click any relative to continue building outward from them.</li>
              </ol>
            </div>
          </div>
        </section>
      </div>

      {showAddRelative && selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-slate-500">Add relative to</div>
                <h3 className="mt-1 text-2xl font-semibold">{selectedPerson.name}</h3>
              </div>
              <button onClick={() => setShowAddRelative(false)} className="rounded-full px-3 py-1 text-slate-500 hover:bg-slate-100">
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Relative name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4 outline-none"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Relationship to {selectedPerson.name.split(" ")[0]}</label>
                <select
                  value={form.relationship}
                  onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4 outline-none"
                >
                  {relationshipOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.alive}
                  onChange={(e) => setForm({ ...form, alive: e.target.checked, email: e.target.checked ? form.email : "" })}
                />
                This relative is still alive
              </label>

              {form.alive && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-11 w-full rounded-2xl border border-slate-200 px-4 outline-none"
                    placeholder="name@example.com"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                  placeholder="Optional notes or context"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddRelative(false)}
                className="h-11 flex-1 rounded-2xl border border-slate-200 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRelative}
                disabled={saving}
                className="h-11 flex-1 rounded-2xl bg-slate-900 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save relative"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
