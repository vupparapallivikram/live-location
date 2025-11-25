/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

// Geolocation types
interface UserLocation {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  userId: string;
}

// WFS Feature types
interface LocationFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    userId: string;
    timestamp: number;
  };
}
