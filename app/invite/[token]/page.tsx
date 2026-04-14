\
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { relationshipOptions } from "@/lib/relationship-options";

type InvitePayload = {
  invite: {
    token: string;
    recipientName: string;
    recipientEmail: string;
    inviterName: string;
    person: {
      id: string;
      name: string;
      alive: boolean;
      email?: string | null;
      notes?: string | null;
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
  customRelationLabel: string;
  alive: boolean;
};

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<InvitePayload | null>(null);

  const [correctedName, setCorrectedName] = useState("");
  const [correctedEmail, setCorrectedEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [relatives, setRelatives] = useState<RelativeForm[]>([
    {
      name: "",
      email: "",
      relationLabel: "Brother",
      customRelationLabel: "",
      alive: true,
    },
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

  const addedCount = useMemo(
    () =>
      relatives.filter((r) => {
        const relation = r.relationLabel === "Other" ? r.customRelationLabel.trim() : r.relationLabel.trim();
        return r.name.trim() && relation;
      }).length,
    [relatives]
  );

  function updateRelative(index: number, patch: Partial<RelativeForm>) {
    setRelatives((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addRelativeRow() {
    setRelatives((prev) => [
      ...prev,
      {
        name: "",
        email: "",
        relationLabel: "Cousin",
        customRelationLabel: "",
        alive: true,
      },
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
      const cleanedRelatives = relatives
        .map((r) => ({
          name: r.name.trim(),
          email: r.alive ? r.email.trim() : "",
          relationLabel: r.relationLabel === "Other" ? r.customRelationLabel.trim() : r.relationLabel.trim(),
          alive: r.alive,
        }))
        .filter((r) => r.name && r.relationLabel);

      const res = await fetch(`/api/invites/${data.invite.token}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: data.invite.person.id,
          correctedName,
          correctedEmail,
          notes,
          relatives: cleanedRelatives,
        }),
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
      const res = await fetch(`/api/invites/${data.invite.token}/unsubscribe`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed");
      window.location.href = `/invite/${data.invite.token}/unsubscribe`;
    } catch (err) {
      console.error(err);
      setError("We could not process your unsubscribe request.");
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 24 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", background: "white", borderRadius: 20, padding: 32 }}>
          Loading invite...
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 24 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", background: "white", borderRadius: 20, padding: 32, color: "#b91c1c" }}>
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom, #f8fafc, white)", padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            background: "#0f172a",
            color: "white",
            borderRadius: 24,
            padding: 32,
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 14, opacity: 0.8 }}>Family Tree Invite</div>
          <h1 style={{ marginTop: 12, fontSize: 34, lineHeight: 1.15 }}>
            {data.invite.inviterName} invited you to verify your family branch
          </h1>
          <p style={{ marginTop: 12, maxWidth: 760, color: "#cbd5e1", lineHeight: 1.6 }}>
            Review your details, correct anything inaccurate, and add at least one relative you know.
          </p>
        </div>

        {saved && (
          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #86efac",
              color: "#166534",
              borderRadius: 20,
              padding: 18,
              marginBottom: 24,
            }}
          >
            Thank you. Your contribution has been saved.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.25fr", gap: 24 }}>
          <div style={{ background: "white", borderRadius: 24, padding: 24, border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>Your current details</h2>
            <div style={{ fontWeight: 600, fontSize: 22 }}>{data.invite.person.name}</div>
            <div style={{ color: "#64748b", marginTop: 6 }}>
              {data.invite.person.alive ? "Living relative" : "In memory"}
            </div>

            {data.invite.person.email && (
              <div style={{ marginTop: 16, fontSize: 14, color: "#334155" }}>
                Email: {data.invite.person.email}
              </div>
            )}

            {data.invite.person.notes && (
              <div
                style={{
                  marginTop: 18,
                  background: "#f8fafc",
                  borderRadius: 16,
                  padding: 16,
                  color: "#334155",
                  lineHeight: 1.6,
                }}
              >
                {data.invite.person.notes}
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Connected relatives</div>
              <div style={{ display: "grid", gap: 10 }}>
                {data.invite.person.relatives.length === 0 && (
                  <div style={{ color: "#64748b" }}>No connected relatives yet.</div>
                )}
                {data.invite.person.relatives.map((relative) => (
                  <div
                    key={relative.id}
                    style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 14 }}
                  >
                    <div style={{ fontWeight: 600 }}>{relative.person.name}</div>
                    <div style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{relative.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: "white", borderRadius: 24, padding: 24, border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>Review and contribute</h2>
            <p style={{ color: "#64748b", marginBottom: 20 }}>
              Correct your details and add one or more relatives.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontWeight: 500, marginBottom: 8 }}>Your name</label>
                <input
                  value={correctedName}
                  onChange={(e) => setCorrectedName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 500, marginBottom: 8 }}>Your email</label>
                <input
                  value={correctedEmail}
                  onChange={(e) => setCorrectedEmail(e.target.value)}
                  type="email"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", fontWeight: 500, marginBottom: 8 }}>Notes or corrections</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
              />
            </div>

            <div
              style={{
                marginTop: 24,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 20,
                padding: 18,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Add relatives</div>
                  <div style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
                    Start with at least one person you know well.
                  </div>
                </div>
                <div
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 999,
                    padding: "6px 12px",
                    fontSize: 13,
                    color: "#334155",
                    background: "white",
                  }}
                >
                  {addedCount} added
                </div>
              </div>

              <div style={{ display: "grid", gap: 16, marginTop: 18 }}>
                {relatives.map((relative, index) => (
                  <div
                    key={index}
                    style={{
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: 18,
                      padding: 16,
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={{ display: "block", fontWeight: 500, marginBottom: 8 }}>Name</label>
                        <input
                          value={relative.name}
                          onChange={(e) => updateRelative(index, { name: e.target.value })}
                          placeholder="Relative name"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontWeight: 500, marginBottom: 8 }}>Email</label>
                        <input
                          value={relative.email}
                          onChange={(e) => updateRelative(index, { email: e.target.value })}
                          type="email"
                          placeholder="name@example.com"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontWeight: 500, marginBottom: 8 }}>Relationship</label>
                        <select
                          value={relative.relationLabel}
                          onChange={(e) => updateRelative(index, { relationLabel: e.target.value })}
                          style={inputStyle}
                        >
                          {relationshipOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                          <input
                            type="checkbox"
                            checked={relative.alive}
                            onChange={(e) => updateRelative(index, { alive: e.target.checked })}
                          />
                          Living relative
                        </label>

                        {relatives.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRelativeRow(index)}
                            style={secondaryButtonStyle}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {relative.relationLabel === "Other" && (
                      <div style={{ marginTop: 16 }}>
                        <label style={{ display: "block", fontWeight: 500, marginBottom: 8 }}>
                          Custom relationship
                        </label>
                        <input
                          value={relative.customRelationLabel}
                          onChange={(e) => updateRelative(index, { customRelationLabel: e.target.value })}
                          placeholder="Enter relationship"
                          style={inputStyle}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button type="button" onClick={addRelativeRow} style={{ ...secondaryButtonStyle, marginTop: 16 }}>
                Add another relative
              </button>
            </div>

            {error && <div style={{ color: "#b91c1c", marginTop: 16 }}>{error}</div>}

            <div style={{ display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
              <button type="button" onClick={submitContribution} disabled={saving} style={primaryButtonStyle}>
                {saving ? "Saving..." : "Save my branch"}
              </button>
              <button type="button" onClick={unsubscribe} style={secondaryButtonStyle}>
                Unsubscribe
              </button>
            </div>

            <div
              style={{
                marginTop: 20,
                background: "#ecfdf5",
                border: "1px solid #86efac",
                borderRadius: 18,
                padding: 16,
                color: "#166534",
                lineHeight: 1.6,
              }}
            >
              This invite is optional. You can correct your details, contribute to the tree, or opt out of future reminders at any time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "10px 12px",
  outline: "none",
  fontSize: 14,
  color: "#0f172a",
  background: "white",
};

const primaryButtonStyle: React.CSSProperties = {
  background: "#0f172a",
  color: "white",
  border: "none",
  borderRadius: 14,
  padding: "12px 16px",
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "white",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  padding: "12px 16px",
  fontWeight: 600,
  cursor: "pointer",
};
