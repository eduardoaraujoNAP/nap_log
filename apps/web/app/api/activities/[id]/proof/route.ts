import { forwardToApi } from "@/lib/server-api";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardToApi(request, `/activities/${encodeURIComponent(id)}/proof`);
}
