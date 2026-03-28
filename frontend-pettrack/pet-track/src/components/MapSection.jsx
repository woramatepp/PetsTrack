import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
 
function MapSection() {
  const mapContainer = useRef(null);
  const map = useRef(null);
 
  useEffect(() => {
    if (map.current) return;
 
    // Initialize map centered on Bangkok
    map.current = L.map(mapContainer.current, {
      zoomControl: false, // Remove default zoom control for cleaner look
    }).setView([13.7563, 100.5018], 13);
 
    // Add tile layer from OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '',
    }).addTo(map.current);
 
    // Custom icon for pet location (Red circle)
    const petIcon = L.divIcon({
      html: `
        <div style="
          background-color: #ff4444;
          border: 3px solid white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 8px rgba(255, 68, 68, 0.6);
        "></div>
      `,
      iconSize: [30, 30],
      className: 'pet-marker',
    });
 
    // Custom icon for safe zone (Pink marker)
    const safeZoneIcon = L.divIcon({
      html: `
        <div style="
          background-color: #ff6b6b;
          border: 2px solid white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 6px rgba(255, 107, 107, 0.6);
        "></div>
      `,
      iconSize: [20, 20],
      className: 'safe-zone-marker',
    });
 
    // Current pet location (Red marker)
    L.marker([13.7563, 100.5018], { icon: petIcon })
      .addTo(map.current)
      .bindPopup('<b>Tawan</b><br>Current Location');
 
    // Safe zone marker (Pink marker)
    L.marker([13.7593, 100.5048], { icon: safeZoneIcon })
      .addTo(map.current)
      .bindPopup('<b>Safe Zone</b><br>Home Area');
 
    // Other location marker (Black circle)
    L.circleMarker([13.7533, 100.4988], {
      radius: 7,
      fillColor: '#333333',
      color: 'white',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    })
      .addTo(map.current)
      .bindPopup('Previous Location');
 
    // Geofence circle (pet's safe zone) - Green
    L.circle([13.7563, 100.5018], {
      radius: 500,
      color: '#8fca8a',
      weight: 2,
      opacity: 0.5,
      fill: true,
      fillColor: '#8fca8a',
      fillOpacity: 0.2,
    })
      .addTo(map.current)
      .bindPopup('Geofence: 500m radius');
 
    // Park/Green zone markers - Light green circles
    const parks = [
      { lat: 13.7443, lng: 100.5148, name: 'Park 1' },
      { lat: 13.7663, lng: 100.4968, name: 'Park 2' },
      { lat: 13.7743, lng: 100.5328, name: 'Park 3' },
    ];
 
    parks.forEach((park) => {
      L.circleMarker([park.lat, park.lng], {
        radius: 7,
        fillColor: '#c8e6c9',
        color: '#8fca8a',
        weight: 1,
        opacity: 0.7,
        fillOpacity: 0.6,
      })
        .addTo(map.current)
        .bindPopup(`<b>${park.name}</b><br>Green Zone`);
    });
 
  }, []);
 
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-yellow-100 h-full">
      <div
        ref={mapContainer}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '1rem',
        }}
      />
    </div>
  );
}
 
export default MapSection;