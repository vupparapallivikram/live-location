import express from "express";

const router = express.Router();

export interface UserLocation {
  id: string;
  lat: number;
  lon: number;
  timestamp: number;
}

export const liveLocations: Record<string, UserLocation> = {};

router.post("/location", (req, res) => {
  const { id, lat, lon } = req.body;

  console.log("📍 Received location:", req.body);

  if (!id || !lat || !lon) {
    return res.status(400).json({ error: "Missing fields" });
  }

  liveLocations[id] = {
    id,
    lat,
    lon,
    timestamp: Date.now(),
  };

  return res.json({ success: true });
});

router.get("/locations", (_req, res) => {
  res.json(liveLocations);
});

export default router;
