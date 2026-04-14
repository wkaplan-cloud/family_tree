"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type InvitePayload = {
  invite: {
    token: string;
    recipientName: string;
    recipientEmail: string;
    inviterName: string;
    remindersEnabled: boolean;
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
  relationLabel: string;
  alive: boolean;
};

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const [token, setToken] = useState("");
  const [data, setData] = useState<InvitePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [correctedName, setCorrectedName] = useState("");
  const [correctedEmail, setCorrectedEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [relatives, setRelatives] = useState<RelativeForm[]>([
    { name: "", email: "", relationLabel: "Sibling", alive: true }
  ]);

  useEffect(() => {
    if (typeof params?.token === "string") setToken(params.token);
  }, [params]);

  useEffect(() => {
    if (!token) return;

    async function loadInvite() {
      try {
        setLoading(true);
        await fetch(`/api/invites/${token}/open`, { method: "POST" });
        const res = await fetch(`/api/invites/${token}`);
        if (!res.ok) throw new Error("Invite not found");
        const payload: InvitePayload = await res.json();
        setData(payload);
        setCorrectedName(payload.invite.person.name || payload.invite.recipientName);
        setCorrectedEmail(payload.invite.person.email || payload.invite.recipientEmail || "");
        setNotes(payload.invite.person.notes || "");
      } catch (err) {
        console.error(err);
        setError("This invite could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    loadInvite();
  }, [token]);

  const relativeCount = useMemo(
    () => relatives.filter((item) => item.name.trim() && item.relationLabel.trim()).length,
    [relatives]
  );

  function updateRelative(index: number, patch: Partial<RelativeForm>) {
    setRelatives((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function saveBranch() {
    if (!data) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/invites/${data.invite.token}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correctedName,
          correctedEmail,
          notes,
          relatives: relatives.filter((item) => item.name.trim() && item.relationLabel.trim())
        })
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setError("");
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
      if (!res.ok) throw new Error("Unsubscribe failed");
      window.location.href = `/invite/${data.invite.token}/unsubscribe`;
    } catch (err) {
      console.error(err);
      setError("We could not unsubscribe you.");
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading invite…</div>;
  }

  if (error && !data) {
    return <div className="flex min-h-screen items-center justify-center text-rose-600">{error}</div>;
  }

  if (!data) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
          <div className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs">Kaplan Family Tree Invite</div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">{data.invite.inviterName} invited you to verify your family branch</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Review your details, correct anything that is wrong, and add one or more relatives you know if you would like to grow the family tree.
          </p>
        </section>

        {saved && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Thank you. Your family branch has been saved.
          </div>
        )}
        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Current details</h2>
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-2xl font-semibold">{data.invite.person.name}</div>
                <div className="text-sm text-slate-500">{data.invite.person.alive ? "Living relative" : "In memory"}</div>
              </div>
              {data.invite.person.email && <div className="text-sm text-slate-700">Email: {data.invite.person.email}</div>}
              {data.invite.person.notes && <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">{data.invite.person.notes}</div>}
              <div>
                <div className="mb-2 text-sm font-medium">Connected relatives</div>
                <div className="space-y-2">
                  {data.invite.person.relatives.map((relative) => (
                    <div key={relative.id} className="rounded-2xl border border-slate-200 p-3">
                      <div className="font-medium">{relative.person.name}</div>
                      <div className="text-xs text-slate-500">{relative.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Review and contribute</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input className="h-11 rounded-2xl border border-slate-200 px-4" value={correctedName} onChange={(e) => setCorrectedName(e.target.value)} placeholder="Your name" />
              <input className="h-11 rounded-2xl border border-slate-200 px-4" value={correctedEmail} onChange={(e) => setCorrectedEmail(e.target.value)} placeholder="Your email" />
            </div>
            <textarea className="mt-4 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes or corrections" />

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Add relatives</div>
                  <div className="text-sm text-slate-500">The branch grows fastest when you add at least one relative you know.</div>
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs">{relativeCount} added</div>
              </div>

              <div className="mt-4 space-y-4">
                {relatives.map((relative, index) => (
                  <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <input className="h-11 rounded-2xl border border-slate-200 px-4" placeholder="Relative name" value={relative.name} onChange={(e) => updateRelative(index, { name: e.target.value })} />
                      <input className="h-11 rounded-2xl border border-slate-200 px-4" placeholder="Relative email" value={relative.email} onChange={(e) => updateRelative(index, { email: e.target.value })} />
                      <input className="h-11 rounded-2xl border border-slate-200 px-4" placeholder="Relationship" value={relative.relationLabel} onChange={(e) => updateRelative(index, { relationLabel: e.target.value })} />
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={relative.alive} onChange={(e) => updateRelative(index, { alive: e.target.checked })} />
                        Living relative
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="mt-4 rounded-2xl border border-slate-200 px-4 py-3"
                onClick={() => setRelatives((prev) => [...prev, { name: "", email: "", relationLabel: "Relative", alive: true }])}
              >
                Add another relative
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button className="rounded-2xl bg-slate-900 px-4 py-3 text-white sm:flex-1" onClick={saveBranch} disabled={saving}>
                {saving ? "Saving…" : "Save my branch"}
              </button>
              <button className="rounded-2xl border border-slate-200 px-4 py-3" onClick={unsubscribe}>Unsubscribe</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
