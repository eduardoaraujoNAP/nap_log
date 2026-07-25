import { NextResponse } from "next/server";
import { forwardToApi } from "@/lib/server-api";
const actions = new Set(["publish", "start", "complete"]);
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  const { id, action } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !actions.has(action))
    return NextResponse.json(
      { message: "Ação de rota inválida" },
      { status: 400 },
    );
  return forwardToApi(request, `/routes/${id}/${action}`, { method: "POST" });
}
