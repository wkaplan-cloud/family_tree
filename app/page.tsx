"use client";

import React, { useEffect, useMemo, useState } from "react";

type Person = {
  id: string;
  name: string;
  alive: boolean;
  email?: string | null;
  notes?: string | null;
  consentStatus?: string | null;
  x?: number;
  y?: number;
};

type Relationship = {
  id: string;
  label: string;
  from: string;
  to: string;
};

type GraphResponse = {
  people: Person[];
  relationships: Relationship[];
};

const START_X = 50;
const START_Y = 46;

function buildPositions(people: Person[]) {
  if (!people.length) return [];
  return people.map((person, index) => {
    if (index === 0) {
      return { ...person, x: START_X, y: START_Y };
    }
    const angle = ((index - 1) / Math.max(1, people.length - 1)) * Math.PI * 2;
    const radius = 28;
    return {
      ...person,
      x: Math.max(10, Math.min(90, START_X + Math.cos(angle) * radius)),
      y: Math.max(14, Math.min(86, START_Y + Math.sin(angle) * radius)),
    };
  });
}

export default function Page() {
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddRelative, setShowAddRelative] = useState(false);
  const [form, setForm] = useState({
    name: "",
    relationship: "Sibling",
    alive: true,
    email: "",
  });

  async function loadGraph() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/graph", { cache: "no-store" });
      const data: GraphResponse = await res.json();
      if (!res.ok) throw new Error((data as any).error || "Could not load the family graph.");
      setPeople(data.people);
      setRelationships(data.relationships);
      setSelectedId((prev) => prev || data.people[0]?.id || "");
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

  const positionedPeople = useMemo(() => buildPositions(people), [people]);
  const selectedPerson = useMemo(
    () => positionedPeople.find((p) => p.id === selectedId) || positionedPeople[0] || null,
    [positionedPeople, selectedId]
  );

  const selectedConnections = useMemo(() => {
    if (!selectedPerson) return [];
    return relationships.filter((r) => r.from === selectedPerson.id || r.to === selectedPerson.id);
  }, [relationships, selectedPerson]);

  async function addRelative() {
    if (!selectedPerson || !form.name.trim() || !form.relationship.trim()) return;

    try {
      setSaving(true);
      setError("");
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePersonId: selectedPerson.id,
          name: form.name,
          relationship: form.relationship,
          alive: form.alive,
          email: form.alive ? form.email : "",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not add relative");

      setForm({ name: "", relationship: "Sibling", alive: true, email: "" });
      setShowAddRelative(false);
      await loadGraph();
    } catch (err) {
      console.error(err);
      setError("Could not add relative.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelectedPerson() {
    if (!selectedPerson) return;
    if (!window.confirm(`Delete ${selectedPerson.name}? This will also remove their linked relationships and invites.`)) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      const res = await fetch(`/api/people/${selectedPerson.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not delete person");
      setSelectedId("");
      await loadGraph();
    } catch (err) {
      console.error(err);
      setError("Could not delete person.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6 rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-300">Kaplan Family Tree</div>
          <h1 className="mt-3 text-4xl font-semibold">Start with one person. Add relatives one by one.</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Select a person, add a relative, and keep building the family tree in a simple flow.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-3xl border bg-white shadow-lg overflow-hidden">
            <div className="border-b px-6 py-4">
              <div className="text-lg font-semibold">Family tree</div>
              <div className="text-sm text-slate-500">Click a person to manage that branch.</div>
            </div>

            <div className="relative h-[700px] bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.15),transparent_42%),linear-gradient(to_bottom,rgba(255,255,255,1),rgba(248,250,252,1))]">
              {loading ? (
                <div className="flex h-full items-center justify-center text-slate-500">Loading family tree…</div>
              ) : (
                <>
                  <svg viewBox="0 0 1000 700" className="absolute inset-0 h-full w-full">
                    {relationships.map((r) => {
                      const a = positionedPeople.find((p) => p.id === r.from);
                      const b = positionedPeople.find((p) => p.id === r.to);
                      if (!a || !b || a.x == null || a.y == null || b.x == null || b.y == null) return null;
                      const x1 = (a.x / 100) * 1000;
                      const y1 = (a.y / 100) * 700;
                      const x2 = (b.x / 100) * 1000;
                      const y2 = (b.y / 100) * 700;
                      const mx = (x1 + x2) / 2;
                      const my = (y1 + y2) / 2;
                      const cx = (x1 + x2) / 2 + (y1 - y2) * 0.08;
                      const cy = (y1 + y2) / 2 + (x2 - x1) * 0.08;

                      return (
                        <g key={r.id}>
                          <path
                            d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                            fill="none"
                            stroke="rgba(15,23,42,0.22)"
                            strokeWidth="2.5"
                            strokeDasharray="6 8"
                            strokeLinecap="round"
                          />
                          <text x={mx} y={my - 8} textAnchor="middle" className="fill-slate-500 text-[11px]">
                            {r.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {positionedPeople.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => setSelectedId(person.id)}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border bg-white/95 px-4 py-2 text-left shadow-lg min-w-[140px] ${
                        selectedPerson?.id === person.id ? "border-slate-900 ring-4 ring-slate-200" : "border-slate-200"
                      }`}
                      style={{ left: `${person.x}%`, top: `${person.y}%` }}
                    >
                      <div className="font-medium text-slate-900">{person.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{person.alive ? "Living" : "In memory"}</div>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border bg-white shadow-lg">
              <div className="border-b px-6 py-4">
                <div className="text-lg font-semibold">Selected person</div>
                <div className="text-sm text-slate-500">Main actions happen here.</div>
              </div>
              <div className="space-y-4 px-6 py-5">
                {selectedPerson ? (
                  <>
                    <div>
                      <div className="text-2xl font-semibold">{selectedPerson.name}</div>
                      <div className="mt-1 text-sm text-slate-500">{selectedPerson.email || "No email saved"}</div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-sm font-medium text-slate-900">Connected relatives</div>
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        {selectedConnections.length ? (
                          selectedConnections.map((connection) => {
                            const otherId = connection.from === selectedPerson.id ? connection.to : connection.from;
                            const other = people.find((p) => p.id === otherId);
                            return (
                              <div key={connection.id} className="rounded-xl border bg-white px-3 py-2">
                                {connection.label} → {other?.name || "Unknown"}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-slate-500">No relatives linked yet.</div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setShowAddRelative((v) => !v)}
                      className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white"
                    >
                      Add relative to {selectedPerson.name}
                    </button>

                    {people.length > 1 && (
                      <button
                        onClick={deleteSelectedPerson}
                        disabled={deleting}
                        className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 font-medium text-rose-700"
                      >
                        {deleting ? "Deleting…" : `Delete ${selectedPerson.name}`}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-slate-500">Select a person to continue.</div>
                )}
              </div>
            </div>

            {showAddRelative && selectedPerson && (
              <div className="rounded-3xl border bg-white shadow-lg">
                <div className="border-b px-6 py-4">
                  <div className="text-lg font-semibold">Add relative</div>
                  <div className="text-sm text-slate-500">Create a new family member linked to {selectedPerson.name}.</div>
                </div>
                <div className="space-y-4 px-6 py-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Relative name</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="h-11 w-full rounded-2xl border px-3"
                      placeholder="Full name"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Relationship to {selectedPerson.name}</label>
                    <input
                      value={form.relationship}
                      onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                      className="h-11 w-full rounded-2xl border px-3"
                      placeholder="Sister, cousin, uncle..."
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.alive}
                      onChange={(e) => setForm({ ...form, alive: e.target.checked })}
                    />
                    Living relative
                  </label>

                  {form.alive && (
                    <div>
                      <label className="mb-2 block text-sm font-medium">Email address</label>
                      <input
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="h-11 w-full rounded-2xl border px-3"
                        placeholder="name@example.com"
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={addRelative}
                      disabled={saving}
                      className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white"
                    >
                      {saving ? "Saving…" : "Save relative"}
                    </button>
                    <button
                      onClick={() => setShowAddRelative(false)}
                      className="rounded-2xl border px-4 py-3 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
