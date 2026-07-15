import { forwardToApi } from "@/lib/server-api";

export async function GET(request: Request) { return forwardToApi(request, "/activities"); }

export async function POST(request: Request) {
  return forwardToApi(request, "/activities", { method: "POST", body: await request.text() });
}
