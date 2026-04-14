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

function initialPosition(index: number, total: number) {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  const radius = index === 0 ? 0 : 28 + (index % 3) * 8;
  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius
  };
}

export default function HomePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [personForm, setPersonForm] = useState({ name: "", alive: true, email: "", notes: "" });
  const [relationshipForm, setRelationshipForm] = useState({ leftId: "", rightId: "", label: "Sibling" });
  const [inviteForm, setInviteForm] = useState({
    personId: "",
    inviterName: "Warren",
    recipientName: "",
    recipientEmail: "",
    remindersEnabled: true
  });

  async function loadGraph() {
    try {
      setLoading(true);
      const res = await fetch("/api/graph");
      if (!res.ok) throw new Error("Failed to load graph");
      const data = await res.json();
      setPeople(data.people);
      setRelationships(data.relationships);
      const firstId = data.people[0]?.id || "";
      setSelectedId((current) => current || firstId);
      setRelationshipForm((current: typeof relationshipForm) => ({
        ...current,
        leftId: current.leftId || firstId,
        rightId: current.rightId || data.people[1]?.id || firstId
      }));
      setInviteForm((current) => ({
        ...current,
        personId: current.personId || firstId,
        recipientName: current.recipientName || data.people[0]?.name || "",
        recipientEmail: current.recipientEmail || data.people[0]?.email || ""
      }));
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

  const filteredPeople = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter((person) =>
      [person.name, person.email || "", person.notes || ""].some((value) => value.toLowerCase().includes(q))
    );
  }, [people, search]);

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    people.forEach((person, index) => map.set(person.id, initialPosition(index, people.length)));
    return map;
  }, [people]);

  const selectedPerson = people.find((person) => person.id === selectedId) || null;

  const connected = useMemo(() => {
    if (!selectedPerson) return [];
    return relationships.filter((item) => item.leftId === selectedPerson.id || item.rightId === selectedPerson.id);
  }, [relationships, selectedPerson]);

  async function addPerson() {
    const res = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(personForm)
    });
    if (!res.ok) {
      setError("Could not create person.");
      return;
    }
    setPersonForm({ name: "", alive: true, email: "", notes: "" });
    await loadGraph();
  }

  async function addRelationship() {
    const res = await fetch("/api/relationships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(relationshipForm)
    });
    if (!res.ok) {
      setError("Could not create relationship.");
      return;
    }
    await loadGraph();
  }

  async function sendInvite() {
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inviteForm)
    });
    if (!res.ok) {
      setError("Could not send invite.");
      return;
    }
    await loadGraph();
    alert("Invite queued. Once email is configured, it will send from your domain.");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
            <div className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs">Kaplan Family Web</div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">A living family tree built like an elastic web</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Start with a few names, connect them through family relationships, and grow each branch through gentle invitation links.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs text-slate-500">People</div>
              <div className="mt-1 text-3xl font-semibold">{people.length}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs text-slate-500">Connections</div>
              <div className="mt-1 text-3xl font-semibold">{relationships.length}</div>
            </div>
          </div>
        </section>

        {error && <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Family map</h2>
                  <p className="text-sm text-slate-500">Elastic strands connect relatives across the family tree.</p>
                </div>
                <input
                  className="h-11 rounded-2xl border border-slate-200 px-4 outline-none"
                  placeholder="Search relatives"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="relative h-[680px] overflow-hidden bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.15),transparent_40%),linear-gradient(to_bottom,#fff,#f8fafc)]">
              {loading ? (
                <div className="flex h-full items-center justify-center text-slate-500">Loading family web…</div>
              ) : (
                <>
                  <svg viewBox="0 0 1000 680" className="absolute inset-0 h-full w-full">
                    {relationships.map((rel) => {
                      const a = positions.get(rel.leftId);
                      const b = positions.get(rel.rightId);
                      if (!a || !b) return null;
                      const x1 = (a.x / 100) * 1000;
                      const y1 = (a.y / 100) * 680;
                      const x2 = (b.x / 100) * 1000;
                      const y2 = (b.y / 100) * 680;
                      return (
                        <g key={rel.id}>
                          <path d={elasticPath(x1, y1, x2, y2)} fill="none" stroke="rgba(15,23,42,0.24)" strokeWidth="2.5" strokeDasharray="6 8" />
                          <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} textAnchor="middle" className="fill-slate-500 text-[11px]">
                            {rel.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {filteredPeople.map((person) => {
                    const pos = positions.get(person.id) || { x: 50, y: 50 };
                    return (
                      <button
                        key={person.id}
                        onClick={() => setSelectedId(person.id)}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border bg-white/95 px-4 py-2 text-left shadow-lg backdrop-blur min-w-[130px] ${
                          selectedId === person.id ? "border-slate-900 ring-4 ring-slate-200" : "border-slate-200"
                        }`}
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${person.alive ? "bg-emerald-500" : "bg-slate-300"}`} />
                          <div className="font-medium text-slate-900">{person.name}</div>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{person.alive ? "Living" : "In memory"}</div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold">Selected person</h3>
              {selectedPerson ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="text-2xl font-semibold">{selectedPerson.name}</div>
                    <div className="text-sm text-slate-500">{selectedPerson.alive ? "Living relative" : "Remembered family member"}</div>
                  </div>
                  {selectedPerson.email && <div className="text-sm text-slate-700">Email: {selectedPerson.email}</div>}
                  {selectedPerson.notes && <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">{selectedPerson.notes}</div>}
                  <div>
                    <div className="mb-2 text-sm font-medium">Connected relatives</div>
                    <div className="flex flex-wrap gap-2">
                      {connected.map((link) => {
                        const otherId = link.leftId === selectedPerson.id ? link.rightId : link.leftId;
                        const other = people.find((person) => person.id === otherId);
                        return (
                          <span key={link.id} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                            {link.label} → {other?.name || "Unknown"}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-sm text-slate-500">Select someone on the map.</div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-semibold">Add person</h3>
                <div className="mt-3 grid gap-3">
                  <input className="h-11 rounded-2xl border border-slate-200 px-4" placeholder="Full name" value={personForm.name} onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })} />
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={personForm.alive} onChange={(e) => setPersonForm({ ...personForm, alive: e.target.checked })} />
                    Living relative
                  </label>
                  <input className="h-11 rounded-2xl border border-slate-200 px-4" placeholder="Email" value={personForm.email} onChange={(e) => setPersonForm({ ...personForm, email: e.target.value })} />
                  <textarea className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Notes" value={personForm.notes} onChange={(e) => setPersonForm({ ...personForm, notes: e.target.value })} />
                  <button className="rounded-2xl bg-slate-900 px-4 py-3 text-white" onClick={addPerson}>Save person</button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Add relationship</h3>
                <div className="mt-3 grid gap-3">
                  <select className="h-11 rounded-2xl border border-slate-200 px-4" value={relationshipForm.leftId} onChange={(e) => setRelationshipForm({ ...relationshipForm, leftId: e.target.value })}>
                    {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                  </select>
                  <select className="h-11 rounded-2xl border border-slate-200 px-4" value={relationshipForm.rightId} onChange={(e) => setRelationshipForm({ ...relationshipForm, rightId: e.target.value })}>
                    {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                  </select>
                  <input className="h-11 rounded-2xl border border-slate-200 px-4" placeholder="Relationship" value={relationshipForm.label} onChange={(e) => setRelationshipForm({ ...relationshipForm, label: e.target.value })} />
                  <button className="rounded-2xl border border-slate-200 px-4 py-3" onClick={addRelationship}>Save relationship</button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Invite relative</h3>
                <div className="mt-3 grid gap-3">
                  <select
                    className="h-11 rounded-2xl border border-slate-200 px-4"
                    value={inviteForm.personId}
                    onChange={(e) => {
                      const picked = people.find((person) => person.id === e.target.value);
                      setInviteForm({
                        ...inviteForm,
                        personId: e.target.value,
                        recipientName: picked?.name || "",
                        recipientEmail: picked?.email || ""
                      });
                    }}
                  >
                    {people.filter((person) => person.alive).map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                  </select>
                  <input className="h-11 rounded-2xl border border-slate-200 px-4" placeholder="From name" value={inviteForm.inviterName} onChange={(e) => setInviteForm({ ...inviteForm, inviterName: e.target.value })} />
                  <input className="h-11 rounded-2xl border border-slate-200 px-4" placeholder="Recipient name" value={inviteForm.recipientName} onChange={(e) => setInviteForm({ ...inviteForm, recipientName: e.target.value })} />
                  <input className="h-11 rounded-2xl border border-slate-200 px-4" placeholder="Recipient email" value={inviteForm.recipientEmail} onChange={(e) => setInviteForm({ ...inviteForm, recipientEmail: e.target.value })} />
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={inviteForm.remindersEnabled} onChange={(e) => setInviteForm({ ...inviteForm, remindersEnabled: e.target.checked })} />
                    Enable gentle reminders
                  </label>
                  <button className="rounded-2xl bg-slate-900 px-4 py-3 text-white" onClick={sendInvite}>Send invite</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
