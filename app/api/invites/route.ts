import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createInviteToken } from "@/lib/tokens";
import { inviteSchema } from "@/lib/validators";
import { sendInviteEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = inviteSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const token = createInviteToken();

    const invite = await prisma.invite.create({
      data: {
        token,
        personId: parsed.data.personId,
        inviterName: parsed.data.inviterName,
        recipientName: parsed.data.recipientName,
        recipientEmail: parsed.data.recipientEmail,
        remindersEnabled: parsed.data.remindersEnabled
      }
    });

    await prisma.person.update({
      where: { id: parsed.data.personId },
      data: {
        email: parsed.data.recipientEmail,
        consentStatus: "invited"
      }
    });

    await sendInviteEmail({
      to: parsed.data.recipientEmail,
      recipientName: parsed.data.recipientName,
      inviterName: parsed.data.inviterName,
      token
    });

    return NextResponse.json({ invite });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
  }
}
