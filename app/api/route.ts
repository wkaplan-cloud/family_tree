import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createInviteToken } from "@/lib/tokens";
import { sendInviteEmail } from "@/lib/email";
import { personSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = personSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const owner = await prisma.user.upsert({
      where: { email: "warren@kaplan.co.za" },
      update: { name: "Warren Kaplan" },
      create: { email: "warren@kaplan.co.za", name: "Warren Kaplan" },
    });

    const person = await prisma.person.create({
      data: {
        name: parsed.data.name,
        alive: parsed.data.alive,
        email: parsed.data.email || undefined,
        notes: parsed.data.notes || undefined,
        createdById: owner.id,
        consentStatus: parsed.data.alive ? "unknown" : "verified",
      },
    });

    let invite: { id: string; token: string } | null = null;
    let emailSent = false;

    if (person.alive && person.email) {
      const token = createInviteToken();

      invite = await prisma.invite.create({
        data: {
          token,
          personId: person.id,
          recipientName: person.name,
          recipientEmail: person.email,
          inviterName: "Warren Kaplan",
          remindersEnabled: true,
        },
        select: {
          id: true,
          token: true,
        },
      });

      const emailResult = await sendInviteEmail({
        to: person.email,
        recipientName: person.name,
        inviterName: "Warren Kaplan",
        token,
      });

      emailSent = Boolean((emailResult as any)?.id);
      console.log("Invite email attempted", {
        personId: person.id,
        inviteId: invite.id,
        email: person.email,
        emailSent,
      });
    }

    return NextResponse.json({ person, invite, emailSent });
  } catch (error) {
    console.error("Failed to create person", error);
    return NextResponse.json({ error: "Failed to create person" }, { status: 500 });
  }
}
