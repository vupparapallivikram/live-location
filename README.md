# Live Location Tracker

A geographical web application for tracking and displaying live user locations on a map.

## Project Overview

This project is part of the **HAW Kiel - Geographical Web Applications WiSe 25/26** course.

### Features
- Retrieve user's location using Browser Geolocation API
- Upload user location to server via API
- Display all users' locations with live updates on map
- WMS and WFS integration with GeoServer

## Technologies Used

- **Frontend Framework:** Vue.js 3
- **Language:** TypeScript
- **Map Library:** OpenLayers
- **OGC Services:** WMS, WFS
- **Backend:** GeoServer
- **Linting:** ESLint with @dataport/eslint-config-geodev

## Project Structure

```
live-location/
├── public/
├── src/
│   ├── components/
│   │   └── MapView.vue
│   ├── services/
│   │   └── geolocation.ts
│   ├── App.vue
│   └── main.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Installation

```bash
# Clone the repository
git clone https://github.com/vupparapallivikram/live-location.git

# Navigate to project directory
cd live-location

# Install dependencies
npm install

# Run development server
npm run dev
```

## Requirements Met

- [x] HTML: Semantic tags, consistent indentation
- [x] CSS: Responsive design
- [x] TypeScript: Properly typed, no `any`
- [x] Vue.js framework
- [x] OpenLayers for mapping
- [x] WMS and WFS services
- [x] ESLint configuration
- [x] Accessibility (WCAG compliant)
- [x] Git version control

## Author

Vikram Vupparapalli

## License

MIT
