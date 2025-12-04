import WebSocket from "ws";

export function startCollegesSocket() {
  const ws = new WebSocket("wss://partner.tty0x-api-app.cloud/api/v1/partner/dashboard/ws");

  ws.on("open", () => console.log("🏢 Colleges WebSocket connected"));
  ws.on("message", (msg) => console.log("🏢 Colleges data:", msg.toString()));
  ws.on("close", () => {
    console.log("❌ Colleges socket closed — reconnecting...");
    setTimeout(startCollegesSocket, 2000);
  });
}
