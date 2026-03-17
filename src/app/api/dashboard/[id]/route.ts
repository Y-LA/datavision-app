import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const dashboard = await prisma.dashboard.findUnique({
      where:   { id },
      include: { file: { select: { name: true } } },
    });

    if (!dashboard) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id:       dashboard.id,
      name:     dashboard.name,
      fileName: dashboard.file.name,
      config:   JSON.parse(dashboard.config),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
