const WebSocket = require("ws");

const ws = new WebSocket("ws://localhost:3000/ws");

ws.on("open", () => {
  console.log("✅ Connected to WebSocket");

  // Step 1: Authenticate (replace with your actual token)
  ws.send(
    JSON.stringify({
      type: "auth",
      token:
        "eyJhbGciOiJIUzI1NiIsImtpZCI6IkYzYVRrS0pubW1uVGlmVWQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3lxbXJqb2pqaHhoYnp4ZnZvcW1nLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmNDg3MDc4NS1kMTNmLTRiZDEtYWU3MC02OGYzNmZiNWNhNjUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYwMTg1MzA3LCJpYXQiOjE3NjAxODE3MDcsImVtYWlsIjoicml0ZXNoa3VtYXJrYXJuNDE0QGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJyaXRlc2hrdW1hcmthcm40MTRAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IlRlc3QgVXNlciIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiZjQ4NzA3ODUtZDEzZi00YmQxLWFlNzAtNjhmMzZmYjVjYTY1In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjAxODE3MDd9XSwic2Vzc2lvbl9pZCI6Ijk4YWMxMjQ0LTE2ZjItNGJlNi05YjU3LTg4YmUxODU4ZjFhZSIsImlzX2Fub255bW91cyI6ZmFsc2V9.khXzmibeWosiOrnya9azdeIuWnS-MqbECyvDogqhmg4", // Get from /auth/signin
    })
  );
});

ws.on("message", (data: any) => {
  const msg = JSON.parse(data);
  console.log("\n📨 Received:", msg);

  // Step 2: After auth success, send chat
  if (msg.type === "auth" && msg.status === "authenticated") {
    console.log("\n✅ Authenticated! Sending chat message...");

    setTimeout(() => {
      ws.send(
        JSON.stringify({
          type: "chat",
          message: "Save my journal for today: Fixed WebSocket authentication",
        })
      );
    }, 500);
  }

  // Step 3: After response, test another message
  if (msg.type === "message") {
    setTimeout(() => {
      ws.send(
        JSON.stringify({
          type: "chat",
          message: "What are my goals?",
        })
      );
    }, 1000);

    // Close after 3 seconds
    setTimeout(() => {
      console.log("\n👋 Closing connection");
      ws.close();
    }, 10000);
  }
});

ws.on("error", (error: any) => {
  console.error("❌ Error:", error.message);
});

ws.on("close", () => {
  console.log("🔌 Disconnected");
});
