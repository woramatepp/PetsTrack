import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ส่วนประกอบสำหรับจัดการการคลิกบนแผนที่
function MapEvents({ setFenceCenter }) {
  useMapEvents({
    click(e) {
      setFenceCenter(e.latlng); // ตั้งค่าจุดศูนย์กลางเมื่อคลิก
    },
  });
  return null;
}

function Overview() {
  const [pet, setPet] = useState(null);
  const [location, setLocation] = useState({ lat: 13.7563, lng: 100.5018 });
  const [fenceCenter, setFenceCenter] = useState(null); // พิกัดศูนย์กลางวงกลม
  const [radius, setRadius] = useState(500); // รัศมี (เมตร)
  const [isInZone, setIsInZone] = useState(true);

  // คำนวณว่าอยู่ในโซนหรือไม่
  useEffect(() => {
    if (fenceCenter && location) {
      const petLatLng = L.latLng(location.lat, location.lng);
      const centerLatLng = L.latLng(fenceCenter.lat, fenceCenter.lng);
      const distance = petLatLng.distanceTo(centerLatLng); // คำนวณระยะทางเป็นเมตร

      const currentInZone = distance <= radius;

      // แจ้งเตือนเมื่อหลุดออกจากโซนครั้งแรก
      if (isInZone && !currentInZone) {
        alert("⚠️ สัตว์เลี้ยงออกนอกโซนปลอดภัย!");
      }
      setIsInZone(currentInZone);
    }
  }, [location, fenceCenter, radius, isInZone]);

  // (ส่วน useEffect ดึงข้อมูล pet และ polling location เหมือนเดิมของคุณ...)
  useEffect(() => {
    const fetchPetData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/pets', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) setPet(data[0]);
        }
      } catch (e) { console.error(e); }
    };
    fetchPetData();
  }, []);

  useEffect(() => {
    if (!pet) return;
    const fetchLocation = async () => {
      try {
        const res = await fetch(`/tracking/latest?pet_id=${pet.ID || pet.id}`);
        if (res.ok) {
          const data = await res.json();
          setLocation({ lat: data.latitude, lng: data.longitude });
        }
      } catch (e) { console.error("Update fail:", e); }
    };
    const interval = setInterval(fetchLocation, 5000);
    return () => clearInterval(interval);
  }, [pet]);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
      <div className="flex-1 bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col min-h-[500px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">ตำแหน่งปัจจุบัน</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm">รัศมี: {radius} เมตร</span>
            <input
              type="range" min="100" max="2000" step="100"
              value={radius} onChange={(e) => setRadius(Number(e.target.value))}
              className="w-32"
            />
          </div>
        </div>

        <div className="flex-1 rounded-2xl overflow-hidden relative">
          <MapContainer center={[location.lat, location.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapEvents setFenceCenter={setFenceCenter} />

            <Marker position={[location.lat, location.lng]} />

            {/* วาดวงกลม Geofence */}
            {fenceCenter && (
              <Circle
                center={fenceCenter}
                radius={radius}
                pathOptions={{ color: isInZone ? '#14b8a6' : '#ef4444', fillColor: isInZone ? '#14b8a6' : '#ef4444' }}
              />
            )}
          </MapContainer>
        </div>
      </div>

      {pet && (
        <div className="w-full lg:w-1/3 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="text-center">
            <div className="w-24 h-24 bg-teal-50 text-teal-600 rounded-full mx-auto flex items-center justify-center text-4xl font-bold mb-4">
              {pet.name.charAt(0)}
            </div>
            <h3 className="text-2xl font-bold">{pet.name}</h3>
            <p className="text-slate-500 mb-6">{pet.type} • {pet.breed}</p>

            <div className="p-4 bg-slate-50 rounded-xl text-left space-y-3">
              <div>
                <p className="text-sm text-slate-400">พิกัดล่าสุด:</p>
                <p className="font-mono font-bold">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
              </div>
              <hr className="border-slate-200" />
              <div>
                <p className="text-sm text-slate-400">สถานะโซน:</p>
                <p className={`font-bold ${isInZone ? 'text-teal-600' : 'text-red-500'}`}>
                  {fenceCenter ? (isInZone ? "🟢 อยู่ในโซน" : "🔴 อยู่นอกโซน") : "⚪ ยังไม่ได้ตั้งค่าโซน"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Overview;