import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { personSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = personSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const admin = await prisma.user.upsert({
      where: { email: "admin@kaplan.co.za" },
      update: {},
      create: { email: "admin@kaplan.co.za", name: "Kaplan Admin" }
    });

    const person = await prisma.person.create({
      data: {
        name: parsed.data.name,
        alive: parsed.data.alive,
        email: parsed.data.email || undefined,
        notes: parsed.data.notes || undefined,
        createdById: admin.id,
        consentStatus: parsed.data.alive ? "unknown" : "verified"
      }
    });

    return NextResponse.json({ person });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create person" }, { status: 500 });
  }
}
