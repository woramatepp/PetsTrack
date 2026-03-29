import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// แก้บั๊กรูปหมุดของ Leaflet ไม่แสดงใน React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapSection() {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    // จำลองการดึงพิกัดจาก DB ของคุณ
    // ของจริงใช้ axios.get('/api/locations') หรือ fetch()
    const fetchLocationsFromDB = async () => {
      // Mock data จำลองข้อมูลจาก DB
      const dbData = [
        { id: 1, petName: 'น้องหมา A', lat: 13.7563, lng: 100.5018 }, // กรุงเทพ
        { id: 2, petName: 'น้องแมว B', lat: 13.7663, lng: 100.5118 }
      ];
      setLocations(dbData);
    };

    fetchLocationsFromDB();
  }, []);

  // จุดกึ่งกลางเริ่มต้น (เช่น กรุงเทพฯ)
  const defaultCenter = [13.7563, 100.5018];

  return (
    <div className="my-6">
      <h2 className="text-xl font-bold mb-4">ตำแหน่งสัตว์เลี้ยงล่าสุด</h2>
      <MapContainer center={defaultCenter} zoom={12} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* วนลูปสร้างหมุดจากข้อมูล DB */}
        {locations.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]}>
            <Popup>
              {loc.petName} <br /> พิกัด: {loc.lat}, {loc.lng}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapSection;