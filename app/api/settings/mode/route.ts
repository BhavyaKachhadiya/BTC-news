import { NextResponse } from "next/server";
import { z } from "zod";
import { getRuntimeSettings, setRuntimeSettings } from "@/config/runtime-settings";

export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  const settings = getRuntimeSettings();
  return NextResponse.json({ enableJev: settings.enableJev });
}

const patchSchema = z.object({ enableJev: z.boolean() });

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "enableJev must be a boolean", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const updated = setRuntimeSettings({ enableJev: parsed.data.enableJev });
  return NextResponse.json({ success: true, enableJev: updated.enableJev });
}
