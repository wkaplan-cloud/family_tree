"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Heart, Mail, Plus, ShieldCheck, Users } from "lucide-react";
import { RELATIONSHIP_OPTIONS, normalizeRelationship } from "@/lib/relationship-options";

type InvitePayload = {
  invite: {
    token: string;
    recipientName: string;
    recipientEmail: string;
    inviterName: string;
    remindersEnabled: boolean;
    contributedAt?: string | null;
    unsubscribedAt?: string | null;
    person: {
      id: string;
      name: string;
      alive: boolean;
      email?: string | null;
      notes?: string | null;
      consentStatus?: string | null;
      relatives: {
        id: string;
        label: string;
        person: {
          id: string;
          name: string;
          alive: boolean;
          email?: string | null;
        };
      }[];
    };
  };
};

type RelativeForm = {
  name: string;
  email: string;
  relationship: string;
  customRelationship: string;
  alive: boolean;
};

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [data, setData] = useState<InvitePayload | null>(null);
  const [error, setError] = useState("");
  const [unsubscribed, setUnsubscribed] = useState(false);

  const [correctedName, setCorrectedName] = useState("");
  const [correctedEmail, setCorrectedEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [relatives, setRelatives] = useState<RelativeForm[]>([
    { name: "", email: "", relationship: "Brother", customRelationship: "", alive: true },
  ]);

  useEffect(() => {
    params.then(({ token }) => setToken(token));
  }, [params]);

  useEffect(() => {
    if (!token) return;

    async function load() {
      try {
        setLoading(true);
        await fetch(`/api/invites/${token}/open`, { method: "POST" });
        const res = await fetch(`/api/invites/${token}`);
        if (!res.ok) throw new Error("Unable to load invite");
        const payload: InvitePayload = await res.json();
        setData(payload);
        setCorrectedName(payload.invite.person.name || payload.invite.recipientName || "");
        setCorrectedEmail(payload.invite.person.email || payload.invite.recipientEmail || "");
        setNotes(payload.invite.person.notes || "");
      } catch (err) {
        console.error(err);
        setError("This invite could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  const relativeCount = useMemo(
    () =>
      relatives.filter(
        (relative) =>
          relative.name.trim().length > 0 &&
          normalizeRelationship(relative.relationship, relative.customRelationship).trim().length > 0
      ).length,
    [relatives]
  );

  function updateRelative(index: number, patch: Partial<RelativeForm>) {
    setRelatives((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addRelativeRow() {
    setRelatives((prev) => [
      ...prev,
      { name: "", email: "", relationship: "Cousin", customRelationship: "", alive: true },
    ]);
  }

  function removeRelativeRow(index: number) {
    setRelatives((prev) => prev.filter((_, i) => i !== index));
  }

  async function submitContribution() {
    if (!data) return;

    setSaving(true);
    setError("");

    try {
      const payload = {
        personId: data.invite.person.id,
        correctedName,
        correctedEmail,
        notes,
        relatives: relatives
          .filter((relative) => relative.name.trim())
          .map((relative) => ({
            name: relative.name.trim(),
            email: relative.alive ? relative.email.trim() : "",
            alive: relative.alive,
            relationLabel: normalizeRelationship(relative.relationship, relative.customRelationship),
          })),
      };

      const res = await fetch(`/api/invites/${data.invite.token}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError("We could not save your contribution.");
    } finally {
      setSaving(false);
    }
  }

  async function unsubscribe() {
    if (!data) return;

    try {
      const res = await fetch(`/api/invites/${data.invite.token}/unsubscribe`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      setUnsubscribed(true);
    } catch (err) {
      console.error(err);
      setError("We could not process your unsubscribe request.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl">
          <Card className="rounded-3xl shadow-lg">
            <CardContent className="p-10 text-center text-slate-500">Loading invite…</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl">
          <Card className="rounded-3xl shadow-lg border-rose-200">
            <CardContent className="p-10 text-center text-rose-600">{error}</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="rounded-3xl border-0 bg-slate-900 text-white shadow-xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
                  <Heart className="h-3.5 w-3.5" /> Family Tree Invite
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                  {data.invite.inviterName} invited you to verify your family branch
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  Review your details, correct anything inaccurate, and add one or more relatives using the same simple relationship list used across the site.
                </p>
              </div>
              <div className="hidden md:flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <Users className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        {(saved || unsubscribed) && (
          <Card className={`rounded-3xl shadow-lg ${saved ? "border-emerald-200" : "border-slate-200"}`}>
            <CardContent className="p-6">
              {saved && (
                <div className="flex items-start gap-3 text-emerald-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5" />
                  <div>
                    <div className="font-medium">Thank you. Your contribution has been saved.</div>
                    <div className="mt-1 text-sm">Your branch is now part of the family tree.</div>
                  </div>
                </div>
              )}
              {unsubscribed && (
                <div className="text-sm text-slate-700">You have been unsubscribed from future reminder emails.</div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-3xl shadow-lg border-slate-200">
            <CardHeader>
              <CardTitle>Your current details</CardTitle>
              <CardDescription>What the family tree currently says about you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-semibold">{data.invite.person.name}</div>
                <div className="mt-1 text-sm text-slate-500">{data.invite.person.alive ? "Living relative" : "In memory"}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                {data.invite.person.email && (
                  <Badge variant="outline" className="rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                    <Mail className="mr-1 h-3.5 w-3.5" /> {data.invite.person.email}
                  </Badge>
                )}
                {data.invite.person.consentStatus && (
                  <Badge variant="outline" className="rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                    {data.invite.person.consentStatus}
                  </Badge>
                )}
              </div>

              {data.invite.person.notes && (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {data.invite.person.notes}
                </div>
              )}

              <Separator />

              <div>
                <div className="mb-3 text-sm font-medium">Connected relatives</div>
                <div className="space-y-2">
                  {data.invite.person.relatives.map((relative) => (
                    <div key={relative.id} className="rounded-2xl border p-3">
                      <div className="font-medium text-slate-900">{relative.person.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{relative.label}</div>
                    </div>
                  ))}
                  {data.invite.person.relatives.length === 0 && (
                    <div className="text-sm text-slate-500">No connected relatives yet.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-lg border-slate-200">
            <CardHeader>
              <CardTitle>Review and contribute</CardTitle>
              <CardDescription>Correct your details and add one or more relatives</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Your name</Label>
                  <Input value={correctedName} onChange={(e) => setCorrectedName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Your email</Label>
                  <Input value={correctedEmail} onChange={(e) => setCorrectedEmail(e.target.value)} type="email" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Notes or corrections</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add context, stories, or corrections" />
              </div>

              <div className="rounded-2xl border bg-slate-50/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-900">Add relatives</div>
                    <div className="text-sm text-slate-500">Use the same relationship dropdown used everywhere else in the app.</div>
                  </div>
                  <Badge variant="outline" className="rounded-full">{relativeCount} added</Badge>
                </div>

                <div className="mt-4 space-y-4">
                  {relatives.map((relative, index) => (
                    <div key={index} className="rounded-2xl border bg-white p-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label>Name</Label>
                          <Input
                            value={relative.name}
                            onChange={(e) => updateRelative(index, { name: e.target.value })}
                            placeholder="Relative name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Email</Label>
                          <Input
                            value={relative.email}
                            onChange={(e) => updateRelative(index, { email: e.target.value })}
                            type="email"
                            placeholder="name@example.com"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Relationship</Label>
                          <select
                            className="h-10 rounded-xl border px-3"
                            value={relative.relationship}
                            onChange={(e) => updateRelative(index, { relationship: e.target.value })}
                          >
                            {RELATIONSHIP_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-end justify-between gap-4">
                          <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={relative.alive}
                              onChange={(e) =>
                                updateRelative(index, {
                                  alive: e.target.checked,
                                  email: e.target.checked ? relative.email : "",
                                })
                              }
                            />
                            Living relative
                          </label>
                          {relatives.length > 1 && (
                            <Button variant="outline" onClick={() => removeRelativeRow(index)} className="rounded-2xl">
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>

                      {relative.relationship === "Other" && (
                        <div className="mt-4 grid gap-2">
                          <Label>Custom relationship</Label>
                          <Input
                            value={relative.customRelationship}
                            onChange={(e) => updateRelative(index, { customRelationship: e.target.value })}
                            placeholder="Example: Stepbrother, Godmother"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Button variant="outline" onClick={addRelativeRow} className="mt-4 rounded-2xl">
                  <Plus className="mr-2 h-4 w-4" /> Add another relative
                </Button>
              </div>

              {error && <div className="text-sm text-rose-600">{error}</div>}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={submitContribution} disabled={saving} className="rounded-2xl sm:flex-1">
                  {saving ? "Saving…" : "Save my branch"}
                </Button>
                <Button variant="outline" onClick={unsubscribe} className="rounded-2xl">
                  Unsubscribe
                </Button>
              </div>

              <div className="rounded-2xl border bg-emerald-50/60 p-4 text-sm leading-6 text-emerald-900">
                <div className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4" /> Your control matters</div>
                <div className="mt-2">
                  This invite is optional. You can correct your details, contribute to the tree, or opt out of future reminders at any time.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}