<template>
	<main>
		<header>
			<h1>Live Location Tracker</h1>
		</header>
		<section id="map-container" aria-label="Map displaying user locations">
			<MapView />
		</section>
		<section id="controls">
			<button 
				@click="shareLocation" 
				class="share-btn"
				aria-label="Share your current location"
			>
				Share My Location
			</button>
		</section>
	</main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MapView from './components/MapView.vue';

const isLoading = ref<boolean>(false);

const shareLocation = (): void => {
	if (!('geolocation' in navigator)) {
		alert('Geolocation is not supported by your browser');
		return;
	}

	isLoading.value = true;

	navigator.geolocation.getCurrentPosition(
		(position: GeolocationPosition) => {
			const { latitude, longitude } = position.coords;
			console.log('Location:', latitude, longitude);
			// TODO: Send to WFS server
			isLoading.value = false;
		},
		(error: GeolocationPositionError) => {
			console.error('Error getting location:', error.message);
			isLoading.value = false;
		}
	);
};
</script>

<style>
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

main {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
}

header {
	background: #2c3e50;
	color: white;
	padding: 1rem;
	text-align: center;
}

#map-container {
	flex: 1;
	min-height: 400px;
}

#controls {
	padding: 1rem;
	text-align: center;
}

.share-btn {
	padding: 1rem 2rem;
	font-size: 1rem;
	background: #3498db;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
}

.share-btn:hover {
	background: #2980b9;
}

.share-btn:focus {
	outline: 3px solid #f39c12;
	outline-offset: 2px;
}

@media (max-width: 600px) {
	#map-container {
		min-height: 300px;
	}
	
	.share-btn {
		width: 100%;
	}
}
</style>
