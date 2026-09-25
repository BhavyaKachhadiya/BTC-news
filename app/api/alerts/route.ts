import { NextRequest, NextResponse } from "next/server";
import { webAlertEngine } from "@/features/alerts/services/alert-engine.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const alerts = webAlertEngine.getAlerts();
    const unreadCount = webAlertEngine.getUnreadCount();
    const config = webAlertEngine.getConfig();

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        unreadCount,
        config,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load alerts",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "test";

    if (action === "test") {
      const alert = webAlertEngine.triggerTestAlert();
      return NextResponse.json({ success: true, data: alert });
    }

    if (action === "evaluate") {
      const alerts = webAlertEngine.evaluatePipeline(body.input || {});
      return NextResponse.json({ success: true, data: alerts });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to trigger alert",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === "markRead" && body.id) {
      webAlertEngine.markAsRead(body.id);
      return NextResponse.json({ success: true });
    }

    if (action === "markAllRead") {
      webAlertEngine.markAllAsRead();
      return NextResponse.json({ success: true });
    }

    if (action === "clear") {
      webAlertEngine.clearAlerts();
      return NextResponse.json({ success: true });
    }

    if (action === "updateConfig" && body.config) {
      const updated = webAlertEngine.updateConfig(body.config);
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update alert state",
      },
      { status: 500 }
    );
  }
}
