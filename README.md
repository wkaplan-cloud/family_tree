# Kaplan Family Tree

A Next.js family tree app with:
- an elastic family-web homepage
- people and relationship creation
- invite links for relatives
- contribution flow to add more family members
- unsubscribe support
- capped reminder emails

## Stack
- Next.js App Router
- Prisma + PostgreSQL
- Resend for email
- Tailwind CSS

## Environment variables
Copy `.env.example` to `.env` and fill in the values.

## Database
Use Supabase Postgres or another PostgreSQL database.

## Commands
```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

## Browser-only upload workflow
If you do not want to use your computer terminal:
1. Download this project zip.
2. Open your GitHub repo in the browser.
3. Upload all files from the unzipped folder.
4. Create a Vercel project from that repo.
5. Add the environment variables in Vercel.
6. Create your Supabase database and add its connection string.
7. Add your Resend API key and sending domain.
8. Deploy.

## Reminder endpoint
The reminder endpoint is:
`POST /api/reminders`

Protect it with the `x-cron-secret` header that matches `CRON_SECRET`.
