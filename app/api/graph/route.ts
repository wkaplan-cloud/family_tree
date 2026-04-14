import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const people = await prisma.person.findMany({ orderBy: { createdAt: "asc" } });
    const relationships = await prisma.relationship.findMany({ orderBy: { createdAt: "asc" } });

    return NextResponse.json({ people, relationships });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load graph" }, { status: 500 });
  }
}
