import { getAgentSettings, saveAgentSettings } from "@/lib/agent-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getAgentSettings());
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!["claude", "custom"].includes(body.cli)) {
    return Response.json({ error: "Invalid cli" }, { status: 400 });
  }
  if (
    body.cli === "custom" &&
    (!body.customTemplate || !body.customTemplate.includes("{prompt}"))
  ) {
    return Response.json(
      { error: "customTemplate must contain {prompt}" },
      { status: 400 }
    );
  }
  saveAgentSettings({ cli: body.cli, customTemplate: body.customTemplate });
  return Response.json({ success: true });
}
