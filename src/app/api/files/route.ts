import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateGuest } from "@/lib/guest";

export async function GET() {
  try {
    const guest = await getOrCreateGuest();
    const files = await prisma.uploadedFile.findMany({
      where:   { userId: guest.id },
      include: { dashboards: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(files);
  } catch (error) {
    console.error("Files error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
