import WebSocket from "ws";

const token =
  "eyJhbGciOiJIUzI1NiIsImtpZCI6IkYzYVRrS0pubW1uVGlmVWQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3lxbXJqb2pqaHhoYnp4ZnZvcW1nLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmNDg3MDc4NS1kMTNmLTRiZDEtYWU3MC02OGYzNmZiNWNhNjUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYwMjkyNDA1LCJpYXQiOjE3NjAyODg4MDUsImVtYWlsIjoicml0ZXNoa3VtYXJrYXJuNDE0QGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJyaXRlc2hrdW1hcmthcm40MTRAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IlRlc3QgVXNlciIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiZjQ4NzA3ODUtZDEzZi00YmQxLWFlNzAtNjhmMzZmYjVjYTY1In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjAyODg4MDV9XSwic2Vzc2lvbl9pZCI6IjNiOTBkMTgwLTgxYTQtNGQyZC05YzUyLTM5NDFhODRhM2EyOSIsImlzX2Fub255bW91cyI6ZmFsc2V9.txQKUjOxMrW6ksueUiAmNA8mmi4A3gYuglwW0lAeReM";

const ws = new WebSocket("ws://localhost:3000/ws");

ws.on("open", () => {
  console.log("Connected");
  ws.send(JSON.stringify({ type: "auth", token }));
});

ws.on("message", (data) => {
  const msg = JSON.parse(data.toString());
  console.log("Received:", msg);

  if (msg.type === "system" && msg.message.includes("Authenticated")) {
    // Test messages
    ws.send(
      JSON.stringify({
        type: "chat",
        message: "Save my journal for today: Testing WebSocket",
      })
    );
  }
});
