import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const invite = await prisma.invite.findUnique({ where: { token } });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    await prisma.invite.update({
      where: { token },
      data: { unsubscribedAt: new Date(), remindersEnabled: false }
    });

    await prisma.person.update({
      where: { id: invite.personId },
      data: { consentStatus: "unsubscribed" }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
