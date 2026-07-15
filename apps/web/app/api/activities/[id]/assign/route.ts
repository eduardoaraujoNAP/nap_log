import { forwardToApi } from "@/lib/server-api";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return forwardToApi(request, `/activities/${encodeURIComponent(id)}/assign`, { method: "POST", body: await request.text() });
}
