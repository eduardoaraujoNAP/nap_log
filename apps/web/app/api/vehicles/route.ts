import { forwardToApi } from "@/lib/server-api";
export async function GET(request:Request){return forwardToApi(request,"/vehicles")}
export async function POST(request:Request){return forwardToApi(request,"/vehicles",{method:"POST",body:await request.text()})}
