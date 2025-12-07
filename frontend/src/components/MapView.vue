<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed } from "vue";

import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import TileWMS from "ol/source/TileWMS";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { GeoJSON } from "ol/format";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { fromLonLat } from "ol/proj";
import { Style, Stroke, Fill, Icon } from "ol/style";

const WS_SERVER = "ws://localhost:3000";
const WMS_BASE_URL = "https://sgx.geodatenzentrum.de/wms_topplus_open";

const BBOX_W = 10.0;
const BBOX_S = 54.2;
const BBOX_E = 10.4;
const BBOX_N = 54.5;

const WFS_BOUNDARIES =
  "https://sgx.geodatenzentrum.de/wfs_vg250" +
  "?service=WFS&version=1.1.0&request=GetFeature" +
  "&typename=vg250:vg250_gem" +
  "&outputFormat=application/json" +
  `&bbox=${BBOX_W},${BBOX_S},${BBOX_E},${BBOX_N},EPSG:4326`;

const mapContainer = ref<HTMLDivElement | null>(null);
let map: Map | null = null;

let baseWmsLayer: TileLayer<TileWMS> | null = null;
let boundariesLayer: VectorLayer<VectorSource> | null = null;
let localLayer: VectorLayer<VectorSource> | null = null;
let remoteLayer: VectorLayer<VectorSource> | null = null;

const showBase = ref(true);
const showBoundaries = ref(true);
const sidebarOpen = ref(false);

const isMobileView = computed(() => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
});

const localUserId = crypto.randomUUID();

type RemoteUser = { userId: string; color: string; lastSeen: number; marker?: Feature<Point> };
const remoteUsers = reactive<Record<string, RemoteUser>>({});

const boundariesStyle = new Style({
  stroke: new Stroke({ color: "#FFFF00", width: 8 }),
  fill: new Fill({ color: "rgba(255,255,0,0.1)" }),
});

const localIconDataUrl = (() => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='48' height='48'>
    <path fill='#2B8AF6' d='M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z'/>
    ircle cx='12' cy='9' r='2.5' fill='white'/>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
})();
const localIconStyle = new Style({
  image: new Icon({ src: localIconDataUrl, scale: 0.9, anchor: [0.5, 1] }),
});

function remoteDataUrl(hexColor: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='48' height='48'>
    <path fill='${hexColor}' d='M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z'/>
    ircle cx='12' cy='9' r='2.5' fill='white'/>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function colorForId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
  h = Math.abs(h) % 360;
  return `hsl(${h} 70% 45%)`;
}

interface WFSFeature {
  type: string;
  geometry: unknown;
  properties: Record<string, unknown>;
}

interface WFSResponse {
  type: string;
  features: WFSFeature[];
}

async function safeFetchJson(url: string): Promise<WFSResponse | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("Fetch not OK", url, res.status);
      return null;
    }
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("json")) {
      const txt = await res.text();
      console.warn("Non-JSON response (skipping). Snippet:", txt.slice(0, 300));
      return null;
    }
    return await res.json() as WFSResponse;
  } catch (err) {
    console.warn("Fetch error", err);
    return null;
  }
}

async function loadWfsBoundaries() {
  if (!boundariesLayer) return;
  const json = await safeFetchJson(WFS_BOUNDARIES);
  if (!json) return;
  try {
    const feats = new GeoJSON().readFeatures(json, {
      dataProjection: "EPSG:4326",
      featureProjection: "EPSG:3857",
    });
    const src = boundariesLayer.getSource();
    src?.clear();
    if (feats.length) src?.addFeatures(feats);
    console.log("Loaded boundaries:", feats.length);
  } catch (err) {
    console.warn("Parsing WFS boundaries failed", err);
  }
}

let ws: WebSocket | null = null;
let reconnectTimer: number | null = null;

function upsertRemote(userId: string, lon: number, lat: number, ts: number) {
  if (userId === localUserId) return;
  const coords = fromLonLat([lon, lat]);
  const existing = remoteUsers[userId];
  if (!existing) {
    const color = colorForId(userId);
    const f = new Feature(new Point(coords));
    f.setStyle(
      new Style({
        image: new Icon({ src: remoteDataUrl(color), scale: 0.8, anchor: [0.5, 1] }),
      }),
    );
    remoteUsers[userId] = { userId, color, lastSeen: ts, marker: f };
    remoteLayer?.getSource()?.addFeature(f);
  } else {
    const m = existing.marker;
    if (m) {
      const g = m.getGeometry();
      if (g instanceof Point) g.setCoordinates(coords);
    }
    existing.lastSeen = ts;
  }
}

function removeRemote(userId: string) {
  const u = remoteUsers[userId];
  if (!u) return;
  if (u.marker) remoteLayer?.getSource()?.removeFeature(u.marker);
  delete remoteUsers[userId];
}

function connectSocket() {
  try {
    ws?.close();
  } catch (error) {
    console.error("Error closing WebSocket:", error);
  }
  ws = new WebSocket(WS_SERVER);

  ws.onopen = () => {
    console.log("WebSocket connected");
    try {
      ws?.send(JSON.stringify({ type: "hello", data: { userId: localUserId } }));
    } catch (error) {
      console.error("Error sending hello message:", error);
    }
  };

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.type === "position") {
        const d = msg.data as { userId: string; lon: number; lat: number; ts: number };
        upsertRemote(d.userId, d.lon, d.lat, d.ts);
      } else if (msg.type === "positions") {
        for (const d of msg.data as Array<{ userId: string; lon: number; lat: number; ts: number }>) {
          upsertRemote(d.userId, d.lon, d.lat, d.ts);
        }
      } else if (msg.type === "disconnect") {
        removeRemote(msg.data.userId);
      }
    } catch (err) {
      console.warn("WS parse error", err);
    }
  };

  ws.onclose = () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = window.setTimeout(connectSocket, 2000);
  };

  ws.onerror = () => {
    try {
      ws?.close();
    } catch (error) {
      console.error("Error in WebSocket error handler:", error);
    }
  };
}

function sendPositionIfReady(lon: number, lat: number) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  try {
    ws.send(JSON.stringify({ type: "position", data: { userId: localUserId, lon, lat, ts: Date.now() } }));
  } catch (err) {
    console.warn("WS send failed", err);
  }
}

onMounted(async () => {
  if (!mapContainer.value) return;

  const osm = new TileLayer({ source: new OSM() });
  baseWmsLayer = new TileLayer({
    source: new TileWMS({
      url: WMS_BASE_URL,
      params: { LAYERS: "web", TILED: true },
      crossOrigin: "anonymous",
    }),
    visible: showBase.value,
  });

  boundariesLayer = new VectorLayer({
    source: new VectorSource(),
    style: boundariesStyle,
    visible: showBoundaries.value,
  });
  localLayer = new VectorLayer({
    source: new VectorSource(),
    style: localIconStyle,
  });
  remoteLayer = new VectorLayer({
    source: new VectorSource(),
  });

  map = new Map({
    target: mapContainer.value ?? undefined,
    layers: [osm, baseWmsLayer, boundariesLayer, localLayer, remoteLayer],
    view: new View({
      center: fromLonLat([10.1228, 54.3233]),
      zoom: 12,
    }),
  });

  await loadWfsBoundaries();

  connectSocket();

  const init = new Feature(new Point(fromLonLat([10.1228, 54.3233])));
  init.setStyle(localIconStyle);
  localLayer.getSource()?.addFeature(init);

  if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition(
      (pos) => {
        const lon = pos.coords.longitude;
        const lat = pos.coords.latitude;
        const coords = fromLonLat([lon, lat]);

        if (!localLayer) return;
        const src = localLayer.getSource();
        if (!src) return;
        const features = src.getFeatures();
        if (!features || features.length === 0) return;
        const first = features[0];
        if (!first) return;
        const geom = first.getGeometry();
        if (geom instanceof Point) geom.setCoordinates(coords);

        const view = map?.getView();
        if (view) view.animate({ center: coords, duration: 300 });

        sendPositionIfReady(lon, lat);
      },
      (err) => {
        console.warn("Geolocation error", err);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
    );
  } else {
    console.warn("Geolocation not supported");
  }
});

onBeforeUnmount(() => {
  try {
    ws?.close();
  } catch (error) {
    console.error("Error closing WebSocket on unmount:", error);
  }
  if (reconnectTimer) clearTimeout(reconnectTimer);
});

function toggleBase() {
  showBase.value = !showBase.value;
  baseWmsLayer?.setVisible(showBase.value);
}

</script>

<template>
  <div class="app-container">
    <button 
      v-if="isMobileView"
      class="mobile-menu-toggle"
      @click="sidebarOpen = !sidebarOpen"
      :aria-label="sidebarOpen ? 'Close menu' : 'Open menu'"
    >
      {{ sidebarOpen ? '✕ Close' : '☰ Menu' }}
    </button>

    <aside 
      class="sidebar"
      :class="{ 'sidebar-open': sidebarOpen }"
    >
      <h3 class="sidebar-title">
        Live Location - Controls
      </h3>

      <div class="controls-section">
        <button
          class="control-button"
          @click="toggleBase"
          aria-label="Toggle base WMS layer visibility"
        >
          {{ showBase ? "Hide Base (WMS)" : "Show Base (WMS)" }}
        </button>
      </div>

      <hr class="divider">

      <h4 class="section-title">
        Connected users
      </h4>
      <div
        v-if="Object.keys(remoteUsers).length === 0"
        class="empty-state"
      >
        No other users visible
      </div>
      <ul class="user-list">
        <li
          v-for="(u, id) in remoteUsers"
          :key="id"
          class="user-item"
        >
          <div
            class="user-color-indicator"
            :style="{ background: u.color }"
            :aria-label="`User marker color`"
          />
          <div class="user-info">
            <div class="user-id">
              {{ id }}
            </div>
            <div class="user-last-seen">
              last: {{ u.lastSeen ? new Date(u.lastSeen).toLocaleTimeString() : "-" }}
            </div>
          </div>
        </li>
      </ul>

      <hr class="divider">
      <div class="your-id-section">
        <strong>Your ID</strong>
        <div class="your-id-value">
          {{ localUserId }}
        </div>
      </div>
    </aside>

    <main class="map-container">
      <div
        ref="mapContainer"
        class="map"
        role="application"
        aria-label="Interactive map showing live location tracking"
      />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  padding: 12px;
  background: white;
  border-right: 1px solid #e6e6e6;
  overflow-y: auto;
  transition: transform 0.3s ease;
  z-index: 100;
}

.sidebar-title {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
}

.controls-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.control-button {
  padding: 10px;
  font-weight: 600;
  background: white;
  border: 2px solid #222;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.control-button:hover {
  background: #f7f7f7;
}

.control-button:focus {
  outline: 2px solid #2B8AF6;
  outline-offset: 2px;
}

.divider {
  margin: 12px 0;
  border: none;
  border-top: 1px solid #eee;
}

.section-title {
  margin: 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.empty-state {
  color: #666;
  margin-bottom: 6px;
  font-size: 14px;
}

.user-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-id {
  font-weight: 600;
  font-size: 13px;
  word-break: break-all;
}

.user-last-seen {
  font-size: 12px;
  color: #666;
}

.your-id-section {
  font-size: 13px;
  color: #333;
}

.your-id-value {
  word-break: break-all;
  margin-top: 6px;
  font-family: monospace;
  font-size: 12px;
}

.map-container {
  flex: 1;
  position: relative;
  min-width: 0;
}

.map {
  width: 100%;
  height: 100%;
}

.mobile-menu-toggle {
  display: none;
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 200;
  padding: 10px 15px;
  background: white;
  border: 2px solid #222;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.mobile-menu-toggle:hover {
  background: #f7f7f7;
}

.mobile-menu-toggle:focus {
  outline: 2px solid #2B8AF6;
  outline-offset: 2px;
}

@media (max-width: 1024px) and (min-width: 768px) {
  .sidebar {
    width: 250px;
  }
  .sidebar-title {
    font-size: 16px;
  }
  .control-button {
    padding: 8px;
    font-size: 14px;
  }
}

@media (max-width: 767px) {
  .app-container {
    flex-direction: column;
  }
  .mobile-menu-toggle {
    display: block;
  }
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 80%;
    max-width: 300px;
    height: 100vh;
    transform: translateX(-100%);
    box-shadow: 2px 0 8px rgba(0,0,0,0.15);
  }
  .sidebar-open {
    transform: translateX(0);
  }
  .map-container {
    width: 100%;
    height: 100vh;
  }
}

@media (max-height: 500px) {
  .sidebar {
    font-size: 12px;
  }
  .sidebar-title {
    font-size: 14px;
    margin-bottom: 8px;
  }
  .control-button {
    padding: 6px;
    font-size: 12px;
  }
  .section-title {
    font-size: 13px;
  }
}

@media print {
  .sidebar {
    display: none;
  }
  .mobile-menu-toggle {
    display: none;
  }
  .map-container {
    width: 100%;
    height: 100%;
  }
}

/* OpenStreetMap attribution positioning – STRICT BOTTOM LEFT */
/* OpenStreetMap attribution – bottom left, no box */
:deep(.ol-attribution) {
  position: absolute;
  bottom: 8px;
  left: 8px;
  top: auto;
  right: auto;
  margin: 0;
  padding: 0;                      
  text-align: left;
  opacity: 0.85;                   
  background: none !important;     
  border: none !important;         
  box-shadow: none !important;     
  z-index: 1000;
}

/* same look for uncollapsible variant */
:deep(.ol-attribution.ol-uncollapsible) {
  background: none !important;
  border: none !important;
  box-shadow: none !important;
  max-width: none;
}
</style>
