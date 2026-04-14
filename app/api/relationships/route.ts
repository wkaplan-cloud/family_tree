import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { relationshipSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = relationshipSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const relationship = await prisma.relationship.create({
      data: {
        leftId: parsed.data.leftId,
        rightId: parsed.data.rightId,
        label: parsed.data.label
      }
    });

    return NextResponse.json({ relationship });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create relationship" }, { status: 500 });
  }
}
