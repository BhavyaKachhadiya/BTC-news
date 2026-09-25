import { NextResponse } from "next/server";
import { economicCalendarService } from "@/features/macro/services/calendar.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const calendar = economicCalendarService.getEconomicCalendar();
    return NextResponse.json({
      success: true,
      data: calendar,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load economic calendar",
      },
      { status: 500 }
    );
  }
}
