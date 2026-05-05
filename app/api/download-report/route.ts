import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import StyleReportDocument, {
  ReportData,
} from "@/components/pdf/StyleReportDocument";

// Future paywall: add auth check here
// e.g. const session = await getServerSession(); if (!session?.isPremium) return 403

export async function POST(request: Request) {
  let reportData: ReportData;
  let portrait = "";
  let figures: string[] = [];

  try {
    const body = await request.json();
    reportData = body.reportData;
    portrait = body.portrait ?? "";
    figures = body.figures ?? [];
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const date = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(StyleReportDocument, {
        portrait,
        figures,
        reportData,
        generatedDate: date,
      }) as any
    );

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="ordre-style-report.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
