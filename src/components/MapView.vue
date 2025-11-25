<template>
	<div 
		id="map" 
		ref="mapContainer" 
		tabindex="0"
		aria-label="Interactive map showing live user locations"
	></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import { Circle, Fill, Stroke, Style } from 'ol/style';

const mapContainer = ref<HTMLElement | null>(null);
let map: Map | null = null;
let wfsSource: VectorSource | null = null;
let refreshInterval: number | null = null;

const WFS_URL = 'http://localhost:8080/geoserver/ows';
const WFS_TYPENAME = 'live-location:user_locations';

const createUserLocationStyle = (): Style => {
	return new Style({
		image: new Circle({
			radius: 8,
			fill: new Fill({ color: '#3498db' }),
			stroke: new Stroke({ color: '#2c3e50', width: 2 })
		})
	});
};

const initMap = (): void => {
	if (!mapContainer.value) return;

	wfsSource = new VectorSource({
		format: new GeoJSON(),
		url: `${WFS_URL}?service=WFS&version=1.0.0&request=GetFeature&typeName=${WFS_TYPENAME}&outputFormat=application/json`
	});

	const wfsLayer = new VectorLayer({
		source: wfsSource,
		style: createUserLocationStyle()
	});

	map = new Map({
		target: mapContainer.value,
		layers: [
			new TileLayer({ source: new OSM() }),
			wfsLayer
		],
		view: new View({
			center: fromLonLat([10.0, 54.3]),
			zoom: 10
		})
	});

	refreshInterval = window.setInterval(() => {
		wfsSource?.refresh();
	}, 10000);
};

onMounted(() => {
	initMap();
});

onUnmounted(() => {
	if (refreshInterval) {
		clearInterval(refreshInterval);
	}
	if (map) {
		map.setTarget(undefined);
	}
});
</script>

<style scoped>
#map {
	width: 100%;
	height: 100%;
	min-height: 400px;
}

#map:focus {
	outline: 3px solid #f39c12;
	outline-offset: -3px;
}
</style>
