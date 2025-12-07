// server.js
import { WebSocketServer } from "ws";
import http from "http";

const server = http.createServer();
const wss = new WebSocketServer({ server });

let users = {}; // userId → { ws, lastPosition }

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === "hello") {
        const userId = data.data.userId;
        users[userId] = { ws, lastPosition: null };
        console.log("User connected:", userId);

        // Send all existing positions to the new user
        const others = Object.entries(users)
          .filter(([id, u]) => u.lastPosition && u.ws !== ws)
          .map(([id, u]) => ({
            userId: id,
            lon: u.lastPosition.lon,
            lat: u.lastPosition.lat,
            ts: u.lastPosition.ts
          }));

        ws.send(JSON.stringify({ type: "positions", data: others }));
      }

      if (data.type === "position") {
        const { userId, lon, lat, ts } = data.data;

        // store user position
        users[userId].lastPosition = { lon, lat, ts };

        // broadcast to everyone else
        for (const [id, u] of Object.entries(users)) {
          if (u.ws.readyState === ws.OPEN && id !== userId) {
            u.ws.send(
              JSON.stringify({ type: "position", data: { userId, lon, lat, ts } })
            );
          }
        }
      }
    } catch (err) {
      console.error("WS parse error:", err);
    }
  });

  ws.on("close", () => {
    const deadUser = Object.keys(users).find((id) => users[id].ws === ws);
    if (deadUser) {
      delete users[deadUser];
      console.log("Disconnected:", deadUser);

      // notify others
      for (const u of Object.values(users)) {
        if (u.ws.readyState === ws.OPEN) {
          u.ws.send(JSON.stringify({ type: "disconnect", data: { userId: deadUser } }));
        }
      }
    }
  });
});

// Listen on all network interfaces!
server.listen(3000, "0.0.0.0", () => {
  console.log("WebSocket server running on ws://0.0.0.0:3000");
});
