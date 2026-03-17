import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateGuest } from "@/lib/guest";
import { parseExcelBuffer } from "@/lib/excel-parser";
import { cleanSheetData } from "@/lib/data-cleaner";
import { generateDashboard } from "@/lib/visualization-engine";

export async function POST(request: Request) {
  try {
    const guest    = await getOrCreateGuest();
    const formData = await request.formData();
    const file     = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer       = Buffer.from(await file.arrayBuffer());
    const parsed       = parseExcelBuffer(buffer, file.name);
    const cleanedSheets = parsed.sheets
      .filter(s => s.rowCount > 0)
      .map(sheet => cleanSheetData(sheet));

    const dashboardConfigs = cleanedSheets.map(sheet => ({
      ...generateDashboard(sheet),
      cleaningReport: sheet.cleaningReport,
    }));

    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        name:       file.name,
        size:       file.size,
        sheetsData: JSON.stringify(cleanedSheets),
        userId:     guest.id,
        dashboards: {
          create: dashboardConfigs.map(config => ({
            name:   config.sheetName,
            config: JSON.stringify(config),
          })),
        },
      },
      include: { dashboards: true },
    });

    return NextResponse.json({
      fileId:       uploadedFile.id,
      fileName:     uploadedFile.name,
      sheets:       cleanedSheets.map(s => s.name),
      dashboardIds: uploadedFile.dashboards.map(d => d.id),
      cleaningReports: cleanedSheets.map(s => ({
        sheet:  s.name,
        report: s.cleaningReport,
      })),
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}
