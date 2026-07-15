import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const devBypass = process.env.NODE_ENV === "development" && process.env.DEV_AUTH_BYPASS === "true";

export async function forwardToApi(request: Request, path: string, init: RequestInit = {}): Promise<NextResponse> {
  if (!apiUrl) return NextResponse.json({ message: "API não configurada" }, { status: 503 });
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET, secureCookie: process.env.NODE_ENV === "production" });
  const accessToken = typeof token?.accessToken === "string" ? token.accessToken : undefined;
  const demoTenant = devBypass ? process.env.DEV_DEMO_TENANT_ID : undefined;
  if (demoTenant && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(demoTenant)) return NextResponse.json({ message: "DEV_DEMO_TENANT_ID inválido" }, { status: 503 });
  if (!accessToken && !demoTenant) return NextResponse.json({ message: "Sessão não autenticada" }, { status: 401 });
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : { "x-tenant-id": demoTenant! }), ...init.headers },
    });
    const body = await response.text();
    return new NextResponse(body || null, { status: response.status, headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ message: "Não foi possível alcançar a API logística" }, { status: 502 });
  }
}
