import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const person = await prisma.person.findUnique({ where: { id } });
    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    const relationshipsCount = await prisma.relationship.count({
      where: {
        OR: [{ leftId: id }, { rightId: id }],
      },
    });

    const invitesCount = await prisma.invite.count({ where: { personId: id } });

    await prisma.$transaction(async (tx) => {
      await tx.relationship.deleteMany({
        where: {
          OR: [{ leftId: id }, { rightId: id }],
        },
      });

      await tx.invite.deleteMany({ where: { personId: id } });

      await tx.person.delete({ where: { id } });
    });

    return NextResponse.json({
      ok: true,
      deletedPersonId: id,
      deletedRelationships: relationshipsCount,
      deletedInvites: invitesCount,
    });
  } catch (error) {
    console.error("Failed to delete person", error);
    return NextResponse.json({ error: "Failed to delete person" }, { status: 500 });
  }
}
