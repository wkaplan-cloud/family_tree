import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        person: {
          include: {
            leftLinks: { include: { right: true } },
            rightLinks: { include: { left: true } }
          }
        }
      }
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    return NextResponse.json({
      invite: {
        token: invite.token,
        recipientName: invite.recipientName,
        recipientEmail: invite.recipientEmail,
        inviterName: invite.inviterName,
        remindersEnabled: invite.remindersEnabled,
        openedAt: invite.openedAt,
        clickedAt: invite.clickedAt,
        contributedAt: invite.contributedAt,
        unsubscribedAt: invite.unsubscribedAt,
        person: {
          id: invite.person.id,
          name: invite.person.name,
          alive: invite.person.alive,
          email: invite.person.email,
          notes: invite.person.notes,
          consentStatus: invite.person.consentStatus,
          relatives: [
            ...invite.person.leftLinks.map((link) => ({
              id: link.id,
              label: link.label,
              person: {
                id: link.right.id,
                name: link.right.name,
                alive: link.right.alive,
                email: link.right.email
              }
            })),
            ...invite.person.rightLinks.map((link) => ({
              id: link.id,
              label: link.label,
              person: {
                id: link.left.id,
                name: link.left.name,
                alive: link.left.alive,
                email: link.left.email
              }
            }))
          ]
        }
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load invite" }, { status: 500 });
  }
}
