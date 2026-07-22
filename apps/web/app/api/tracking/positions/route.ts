import { forwardToApi } from "@/lib/server-api";

export async function GET(request: Request) {
  return forwardToApi(request, "/tracking/positions");
}
