/**
 * WFS Service - Handles WFS-T operations with GeoServer
 * GeoServer running at localhost:8080
 */

import GeoJSON from 'ol/format/GeoJSON';
import { LocationData } from './locationService';

// GeoServer WFS endpoint configuration
const GEOSERVER_URL = 'http://localhost:8080/geoserver';
const WORKSPACE = 'live_locations';
const LAYER_NAME = 'user_locations';

export interface WFSConfig {
  url: string;
  workspace: string;
  layerName: string;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: Record<string, string | number>;
}

/**
 * Get WFS URL for fetching features
 */
export function getWFSUrl(config: WFSConfig = getDefaultConfig()): string {
  return `${config.url}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=${config.workspace}:${config.layerName}&outputFormat=application/json`;
}

/**
 * Get default GeoServer configuration
 */
export function getDefaultConfig(): WFSConfig {
  return {
    url: GEOSERVER_URL,
    workspace: WORKSPACE,
    layerName: LAYER_NAME
  };
}

/**
 * Create GeoJSON feature from location data
 */
export function createLocationFeature(
  location: LocationData,
  userId: string
): GeoJSONFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [location.longitude, location.latitude]
    },
    properties: {
      userId: userId,
      timestamp: location.timestamp,
      accuracy: location.accuracy
    }
  };
}

/**
 * Upload location to WFS server using WFS-T Insert
 */
export async function uploadLocation(
  location: LocationData,
  userId: string,
  config: WFSConfig = getDefaultConfig()
): Promise<boolean> {
  const feature = createLocationFeature(location, userId);
  
  const wfsTransaction = `
    <wfs:Transaction service="WFS" version="2.0.0"
      xmlns:wfs="http://www.opengis.net/wfs/2.0"
      xmlns:gml="http://www.opengis.net/gml/3.2"
      xmlns:${config.workspace}="http://${config.workspace}">
      <wfs:Insert>
        <${config.workspace}:${config.layerName}>
          <${config.workspace}:geom>
            <gml:Point srsName="EPSG:4326">
              <gml:pos>${feature.geometry.coordinates[1]} ${feature.geometry.coordinates[0]}</gml:pos>
            </gml:Point>
          </${config.workspace}:geom>
          <${config.workspace}:user_id>${userId}</${config.workspace}:user_id>
          <${config.workspace}:timestamp>${location.timestamp}</${config.workspace}:timestamp>
          <${config.workspace}:accuracy>${location.accuracy}</${config.workspace}:accuracy>
        </${config.workspace}:${config.layerName}>
      </wfs:Insert>
    </wfs:Transaction>
  `;

  try {
    const response = await fetch(`${config.url}/wfs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml'
      },
      body: wfsTransaction
    });
    return response.ok;
  } catch (error) {
    console.error('WFS upload failed:', error);
    return false;
  }
}

/**
 * Fetch all user locations from WFS
 */
export async function fetchAllLocations(
  config: WFSConfig = getDefaultConfig()
): Promise<GeoJSONFeature[]> {
  try {
    const response = await fetch(getWFSUrl(config));
    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    return [];
  }
}

/**
 * Create OpenLayers GeoJSON format instance
 */
export function createGeoJSONFormat(): GeoJSON {
  return new GeoJSON();
}
