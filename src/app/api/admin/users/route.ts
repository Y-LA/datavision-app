import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is an ADMIN
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      console.log("UNAUTHORIZED ADMIN ACCESS ATTEMPT:", session?.user);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { files: true }
        }
      },
      orderBy: { createdAt: "desc" },
    } as any);

    return NextResponse.json(users);
  } catch (error) {
    console.error("Admin Users Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
