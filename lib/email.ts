import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const emailFrom = process.env.EMAIL_FROM || "Kaplan Family Tree <noreply@example.com>";

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.log("Email disabled: missing RESEND_API_KEY", { to, subject });
    return { id: "mock-email" };
  }

  return resend.emails.send({
    from: emailFrom,
    to,
    subject,
    html
  });
}

export async function sendInviteEmail({
  to,
  recipientName,
  inviterName,
  token
}: {
  to: string;
  recipientName: string;
  inviterName: string;
  token: string;
}) {
  const inviteUrl = `${baseUrl}/invite/${token}`;
  const unsubscribeUrl = `${baseUrl}/invite/${token}/unsubscribe`;

  return sendEmail({
    to,
    subject: `${recipientName}, help preserve your family story`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;line-height:1.6;color:#0f172a;">
        <h2 style="margin-bottom:12px;">You were added to the Kaplan family tree</h2>
        <p>Hi ${recipientName},</p>
        <p>${inviterName} added you to a shared family tree so your branch can be recorded accurately.</p>
        <p>You can review your details, correct anything that is wrong, and add one or more relatives you know.</p>
        <p><a href="${inviteUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none;">Review your branch</a></p>
        <p>This invitation is optional. If you do not want follow-up reminders, you can unsubscribe here:</p>
        <p><a href="${unsubscribeUrl}">${unsubscribeUrl}</a></p>
        <p>With care,<br/>${inviterName}</p>
      </div>
    `
  });
}

export async function sendReminderEmail({
  to,
  recipientName,
  inviterName,
  token
}: {
  to: string;
  recipientName: string;
  inviterName: string;
  token: string;
}) {
  const inviteUrl = `${baseUrl}/invite/${token}`;
  const unsubscribeUrl = `${baseUrl}/invite/${token}/unsubscribe`;

  return sendEmail({
    to,
    subject: `Reminder: your family branch is waiting for you`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;line-height:1.6;color:#0f172a;">
        <h2 style="margin-bottom:12px;">A gentle reminder</h2>
        <p>Hi ${recipientName},</p>
        <p>${inviterName} invited you to review and grow your family branch.</p>
        <p>If you would still like to take part, you can pick up where you left off here:</p>
        <p><a href="${inviteUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none;">Continue the family tree</a></p>
        <p>If you would rather not receive future reminders, unsubscribe here:</p>
        <p><a href="${unsubscribeUrl}">${unsubscribeUrl}</a></p>
      </div>
    `
  });
}
