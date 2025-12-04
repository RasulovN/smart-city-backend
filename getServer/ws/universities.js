import WebSocket from "ws";

export function startUniversitiesSocket() {
  const ws = new WebSocket("wss://partner.tty0x-api-app.cloud/api/v1/partner/dashboard/ws");

  ws.on("open", () => console.log("🎓 Universities WebSocket connected"));
  ws.on("message", (msg) => console.log("🎓 Universities data:", msg.toString()));
  ws.on("close", () => {
    console.log("❌ Universities socket closed — reconnecting...");
    setTimeout(startUniversitiesSocket, 2000);
  });
}
