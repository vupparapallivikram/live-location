import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import locationRouter, { liveLocations } from "./routes/location";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", locationRouter);

const server = app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});

const wss = new WebSocketServer({ server });

// Broadcast updated locations every second
setInterval(() => {
  const data = JSON.stringify(liveLocations);
  wss.clients.forEach((client: any) => {
    if (client.readyState === 1) client.send(data);
  });
}, 1000);
