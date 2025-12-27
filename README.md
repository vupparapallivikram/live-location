## Project Topic

This project implements a web-based real-time location tracking system using modern web mapping technologies. Users can view their own live location and see other connected users on an interactive map. The application integrates WMS (Web Map Srvice) for the base map and WFS (Web Feature Service) for displaying municipal boundaries in Germany.

## Project Description

The application is built using Vue 3, Vite, TypeScript, and OpenLayers.
A Node.js WebSocket server handles real-time communication between users.
 
##   Main functionality:

    - Displays an interactive OpenLayers map with a WMS base layer (TopPlus Open).
    - Loads and visualizes WFS municipal boundaries from the German Federal Agency for Cartography.
    - Tracks and updates the user’s live geolocation on the map.
    - Shows locations of all connected users in real time using WebSockets.
    - Supports a mobile-friendly UI with accessible interaction.
    - This project demonstrates the integration of geospatial services (WMS/WFS) with a real-time communication system in a modern web framework.

## Project Features

    - Real-time multi-user location sharing using WebSockets
    - Live map visualization with OpenLayers
    - WMS base map layers from the German Federal Agency for Cartography (TopPlus Open)
    - WFS vector boundaries of the Kiel region
    - Mobile-friendly sidebar and controls
    - Accessibility-friendly UI (tested up to 100%)
    - Simple layer toggle (Base WMS ON/OFF)

## Project Structure :

project-root/
├─ frontend/          # Vue 3 + Vite + TypeScript app (MapView.vue)
│  └─ src/
│     └─ components/
│        └─ MapView.vue
│
├─ backend/           # Optional
│  └─ src/
│     └─ routes/
│        └─ server.ts
│
├─ server.js          # Main Node.js WebSocket server used by the app (small js module)
├─ package.json       # Root package
└─ README.md


## Prerequisites
- Node.js (version 18+ recommended)
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for WMS/WFS services

## Technologies Used
- Vue 3 + Vite (Frontend framework + bundler)
- TypeScript
- OpenLayers (Web mapping)
- Node.js WebSocket Server
- WMS / WFS Services from Bundesamt für Kartographie und Geodäsie (BKG)


## How to Build and Run the Project :

1. Start the WebSocket Server

    Navigate to the root folder: (In Terminal)

    npm install
    node server.js

This starts the WebSocket server on:
ws://localhost:3000

*// optional //*

2. Run the backend 

    cd backend
    npm install
    npm run dev

3. Run the Frontend (Vue Application)
    Navigate to the frontend folder: (In Terminal)

    cd frontend
    npm install
    npm run dev

The frontend will be available at:
http://localhost:5173

4. Using the Application

Open the frontend URL in your browser.
Allow geolocation access when prompted.
Your location will appear on the map.
Other connected users will appear with different colored markers.
The WMS base map and WFS municipal boundaries load automatically.
Use the sidebar to toggle the WMS layer (desktop + mobile responsive)


