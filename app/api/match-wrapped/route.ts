import { NextRequest, NextResponse } from "next/server";
import { buildWrappedScript, MATCH_WRAPPED_PARTY_SLUG } from "@/lib/match-wrapped";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const partyId = searchParams.get("partyId");
  const viewerAndrewID = searchParams.get("viewerAndrewID") ?? "";

  if (!partyId) {
    return NextResponse.json({ error: "Missing partyId" }, { status: 400 });
  }

  if (partyId !== MATCH_WRAPPED_PARTY_SLUG) {
    return NextResponse.json({ error: "Wrapped is disabled for this party" }, { status: 403 });
  }

  try {
    const script = await buildWrappedScript(partyId, viewerAndrewID);
    return NextResponse.json(script);
  } catch (error) {
    console.error("Failed to build wrapped script:", error);
    return NextResponse.json({ error: "Failed to build wrapped script" }, { status: 500 });
  }
}
