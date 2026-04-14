import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";

const MAX_REMINDERS = 3;
const MIN_DAYS_BETWEEN = 4;

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = daysAgo(MIN_DAYS_BETWEEN);
    const invites = await prisma.invite.findMany({
      where: {
        remindersEnabled: true,
        unsubscribedAt: null,
        contributedAt: null,
        remindersSent: { lt: MAX_REMINDERS },
        createdAt: { lte: cutoff }
      }
    });

    let sent = 0;
    for (const invite of invites) {
      await sendReminderEmail({
        to: invite.recipientEmail,
        recipientName: invite.recipientName,
        inviterName: invite.inviterName,
        token: invite.token
      });

      await prisma.invite.update({
        where: { id: invite.id },
        data: { remindersSent: { increment: 1 } }
      });
      sent += 1;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}
