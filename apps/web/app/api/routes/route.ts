import { forwardToApi } from "@/lib/server-api";
export async function GET(request: Request) {
  return forwardToApi(request, "/routes");
}
export async function POST(request: Request) {
  return forwardToApi(request, "/routes", {
    method: "POST",
    body: await request.text(),
  });
}
