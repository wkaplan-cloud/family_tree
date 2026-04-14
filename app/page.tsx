"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, UserPlus, Mail, Heart } from "lucide-react";
import { RELATIONSHIP_OPTIONS, normalizeRelationship } from "@/lib/relationship-options";

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
  label: string;
  fromId: string;
  toId: string;
};

type GraphPayload = {
  people: Person[];
  relationships: Relationship[];
};

type RelativeForm = {
  name: string;
  relationship: string;
  customRelationship: string;
  alive: boolean;
  email: string;
};

function personTone(alive: boolean) {
  return alive ? "bg-emerald-500" : "bg-slate-300";
}

export default function Page() {
  const [data, setData] = useState<GraphPayload | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddRelative, setShowAddRelative] = useState(false);

  const [form, setForm] = useState<RelativeForm>({
    name: "",
    relationship: "Brother",
    customRelationship: "",
    alive: true,
    email: "",
  });

  async function loadGraph() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/graph", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load the family graph.");
      const payload = await res.json();
      setData(payload);
      if (!selectedId && payload.people?.length) {
        const root =
          payload.people.find((person: Person) => person.email === "warren@kaplan.co.za") ||
          payload.people[0];
        setSelectedId(root.id);
      }
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

  const people = data?.people ?? [];
  const relationships = data?.relationships ?? [];

  const selectedPerson = useMemo(
    () => people.find((person) => person.id === selectedId) ?? people[0] ?? null,
    [people, selectedId]
  );

  useEffect(() => {
    if (selectedPerson && selectedPerson.id !== selectedId) {
      setSelectedId(selectedPerson.id);
    }
  }, [selectedPerson, selectedId]);

  const connectedRelatives = useMemo(() => {
    if (!selectedPerson) return [];
    return relationships
      .filter((relationship) => relationship.fromId === selectedPerson.id || relationship.toId === selectedPerson.id)
      .map((relationship) => {
        const relativeId = relationship.fromId === selectedPerson.id ? relationship.toId : relationship.fromId;
        const relative = people.find((person) => person.id === relativeId);
        return {
          relationship,
          relative,
        };
      })
      .filter((entry) => entry.relative);
  }, [selectedPerson, relationships, people]);

  async function addRelative() {
    if (!selectedPerson) return;
    if (!form.name.trim()) {
      setError("Please add the relative’s name.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const relationLabel = normalizeRelationship(form.relationship, form.customRelationship);

      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anchorPersonId: selectedPerson.id,
          name: form.name.trim(),
          relationLabel,
          alive: form.alive,
          email: form.alive ? form.email.trim() : "",
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error || "Could not add relative.");
      }

      setForm({
        name: "",
        relationship: "Brother",
        customRelationship: "",
        alive: true,
        email: "",
      });
      setShowAddRelative(false);
      await loadGraph();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not add relative.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelectedPerson() {
    if (!selectedPerson) return;
    if (people.length <= 1) return;

    const confirmed = window.confirm(`Delete ${selectedPerson.name}? This will also remove linked relationships and invites.`);
    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      const res = await fetch(`/api/people/${selectedPerson.id}`, {
        method: "DELETE",
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error || "Could not delete this person.");
      }

      await loadGraph();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not delete this person.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl">
          <Card className="rounded-3xl shadow-lg">
            <CardContent className="p-10 text-center text-slate-500">Loading family graph…</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl">
          <Card className="rounded-3xl border-rose-200 shadow-lg">
            <CardContent className="p-10 text-center text-rose-600">{error}</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="rounded-3xl border-0 bg-slate-900 text-white shadow-xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
                  <Heart className="h-3.5 w-3.5" /> Kaplan Family Tree
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                  Start with one person and build outward, one relative at a time
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  Click a family member to view their branch, then add a relative using a simple guided flow.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="rounded-3xl border-rose-200 shadow-lg">
            <CardContent className="p-4 text-sm text-rose-600">{error}</CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-3xl shadow-lg border-slate-200">
            <CardHeader>
              <CardTitle>Selected person</CardTitle>
              <CardDescription>Choose who you want to expand from</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPerson ? (
                <>
                  <div>
                    <div className="text-2xl font-semibold text-slate-900">{selectedPerson.name}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      {selectedPerson.alive ? "Living relative" : "Remembered family member"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedPerson.email ? (
                      <Badge variant="outline" className="rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                        <Mail className="mr-1 h-3.5 w-3.5" /> {selectedPerson.email}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                        No email stored
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Dialog open={showAddRelative} onOpenChange={setShowAddRelative}>
                      <DialogTrigger asChild>
                        <Button className="rounded-2xl sm:flex-1">
                          <UserPlus className="mr-2 h-4 w-4" /> Add relative to {selectedPerson.name}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-3xl sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Add a relative to {selectedPerson.name}</DialogTitle>
                        </DialogHeader>

                        <div className="grid gap-4 pt-2">
                          <div className="grid gap-2">
                            <Label>Relative name</Label>
                            <Input
                              value={form.name}
                              onChange={(e) => setForm({ ...form, name: e.target.value })}
                              placeholder="Full name"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Relationship</Label>
                            <select
                              className="h-10 rounded-xl border px-3"
                              value={form.relationship}
                              onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                            >
                              {RELATIONSHIP_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>

                          {form.relationship === "Other" && (
                            <div className="grid gap-2">
                              <Label>Custom relationship</Label>
                              <Input
                                value={form.customRelationship}
                                onChange={(e) => setForm({ ...form, customRelationship: e.target.value })}
                                placeholder="Example: Godfather, Stepbrother"
                              />
                            </div>
                          )}

                          <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={form.alive}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  alive: e.target.checked,
                                  email: e.target.checked ? form.email : "",
                                })
                              }
                            />
                            Living relative
                          </label>

                          {form.alive && (
                            <div className="grid gap-2">
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="name@example.com"
                              />
                            </div>
                          )}

                          <Button onClick={addRelative} disabled={saving} className="rounded-2xl">
                            {saving ? "Saving…" : "Save relative"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {people.length > 1 && (
                      <Button
                        variant="outline"
                        className="rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50"
                        onClick={deleteSelectedPerson}
                        disabled={deleting}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deleting ? "Deleting…" : `Delete ${selectedPerson.name}`}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-500">No family member found.</div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-lg border-slate-200">
            <CardHeader>
              <CardTitle>Family members</CardTitle>
              <CardDescription>Click any person to make them the current focus</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {people.map((person) => (
                <button
                  key={person.id}
                  onClick={() => setSelectedId(person.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedPerson?.id === person.id
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${personTone(person.alive)}`} />
                    <div className="font-medium text-slate-900">{person.name}</div>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {person.alive ? "Living" : "In memory"}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl shadow-lg border-slate-200">
          <CardHeader>
            <CardTitle>{selectedPerson?.name || "Selected person"}’s connected relatives</CardTitle>
            <CardDescription>Clean list view of the current branch</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {connectedRelatives.length > 0 ? (
              connectedRelatives.map((entry) => (
                <div key={entry.relationship.id} className="rounded-2xl border p-4">
                  <div className="font-medium text-slate-900">{entry.relative?.name}</div>
                  <div className="mt-1 text-sm text-slate-500">{entry.relationship.label}</div>
                  {entry.relative?.email && (
                    <div className="mt-2 text-sm text-slate-700">{entry.relative.email}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">No connected relatives yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}