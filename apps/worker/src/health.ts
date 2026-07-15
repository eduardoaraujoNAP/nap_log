import { createServer, type Server } from "node:http";

export interface Heartbeat { startedAt: string; lastBeatAt: string }

export function startHealthServer(port: number, heartbeat: Heartbeat): Server {
  return createServer((request, response) => {
    if (request.method !== "GET" || request.url !== "/health") {
      response.writeHead(404, { "content-type": "application/json" }).end(JSON.stringify({ status: "not_found" }));
      return;
    }
    response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    response.end(JSON.stringify({ status: "ok", service: "nap-log-worker", ...heartbeat }));
  }).listen(port);
}
