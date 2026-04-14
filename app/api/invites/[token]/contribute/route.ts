import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contributeSchema } from "@/lib/validators";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const json = await req.json();
    const parsed = contributeSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { person: true }
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.person.update({
        where: { id: invite.personId },
        data: {
          name: parsed.data.correctedName,
          email: parsed.data.correctedEmail || undefined,
          notes: parsed.data.notes || undefined,
          consentStatus: "verified"
        }
      });

      for (const relative of parsed.data.relatives) {
        const person = await tx.person.create({
          data: {
            name: relative.name,
            alive: relative.alive,
            email: relative.email || undefined,
            notes: `Added from invite contribution by ${parsed.data.correctedName}`,
            consentStatus: relative.alive ? "unknown" : "verified",
            createdById: invite.person.createdById
          }
        });

        await tx.relationship.create({
          data: {
            leftId: invite.personId,
            rightId: person.id,
            label: relative.relationLabel
          }
        });
      }

      await tx.invite.update({
        where: { token },
        data: {
          contributedAt: new Date(),
          openedAt: invite.openedAt ?? new Date(),
          clickedAt: invite.clickedAt ?? new Date()
        }
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save contribution" }, { status: 500 });
  }
}
