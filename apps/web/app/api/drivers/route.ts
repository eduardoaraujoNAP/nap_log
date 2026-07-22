import { forwardToApi } from "@/lib/server-api";
export async function GET(request:Request){return forwardToApi(request,"/drivers")}
export async function POST(request:Request){return forwardToApi(request,"/drivers",{method:"POST",body:await request.text()})}
