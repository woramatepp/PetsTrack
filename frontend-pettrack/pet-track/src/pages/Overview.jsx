import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ส่วนช่วยจัดการการคลิกบนแผนที่เพื่อตั้งพิกัดวงกลม
function MapEvents({ setFenceCenter }) {
  useMapEvents({
    click(e) {
      setFenceCenter(e.latlng);
    },
  });
  return null;
}

function Overview() {
  const [pet, setPet] = useState(null);
  const [location, setLocation] = useState({ lat: 13.7563, lng: 100.5018 });
  const [fenceCenter, setFenceCenter] = useState(null);
  const [radius, setRadius] = useState(500);
  const [isInZone, setIsInZone] = useState(true);
  const [loading, setLoading] = useState(true);

  // 1. ดึงข้อมูลสัตว์เลี้ยง
  useEffect(() => {
    const fetchPetData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/pets', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setPet(data[0]); // ดึงตัวแรก (เพราะมีได้ตัวเดียว)
          }
        }
      } catch (e) {
        console.error("Fetch pet error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPetData();
  }, []);

  // 2. ดึงพิกัดล่าสุด (Polling ทุก 5 วินาที)
  useEffect(() => {
    if (!pet) return;

    const fetchLocation = async () => {
      try {
        const res = await fetch(`/tracking/latest?pet_id=${pet.ID}`);
        if (res.ok) {
          const data = await res.json();
          const newLoc = { lat: data.latitude, lng: data.longitude };
          setLocation(newLoc);

          // ตรวจสอบ Geofence
          if (fenceCenter) {
            const petLatLng = L.latLng(newLoc.lat, newLoc.lng);
            const centerLatLng = L.latLng(fenceCenter.lat, fenceCenter.lng);
            const distance = petLatLng.distanceTo(centerLatLng);
            setIsInZone(distance <= radius);
          }
        }
      } catch (e) {
        console.error("Update location fail:", e);
      }
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 5000);
    return () => clearInterval(interval);
  }, [pet, fenceCenter, radius]);

  if (loading) return <div className="p-10 text-center">กำลังโหลดข้อมูล...</div>;

  if (!pet) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold text-slate-400">ไม่พบข้อมูลสัตว์เลี้ยง</h2>
        <p className="mt-2 text-slate-500">กรุณาเพิ่มสัตว์เลี้ยงที่หน้า "สัตว์เลี้ยงของฉัน" ก่อนครับ</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
      {/* ฝั่งซ้าย: แผนที่ */}
      <div className="flex-1 bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col min-h-[500px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">แผนที่ติดตาม</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">รัศมีปลอดภัย: {radius} ม.</span>
            <input
              type="range" min="100" max="2000" step="100"
              value={radius} onChange={(e) => setRadius(Number(e.target.value))}
              className="w-32 h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="flex-1 rounded-2xl overflow-hidden relative border border-slate-100">
          <MapContainer center={[location.lat, location.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapEvents setFenceCenter={setFenceCenter} />

            <Marker position={[location.lat, location.lng]}>
              {/* ใส่ Popup บอกชื่อสัตว์เลี้ยงบนหัวหมุด */}
              <Marker position={[location.lat, location.lng]} />
            </Marker>

            {fenceCenter && (
              <Circle
                center={fenceCenter}
                radius={radius}
                pathOptions={{
                  color: isInZone ? '#14b8a6' : '#ef4444',
                  fillColor: isInZone ? '#14b8a6' : '#ef4444',
                  fillOpacity: 0.2
                }}
              />
            )}
          </MapContainer>
        </div>
        <p className="mt-2 text-xs text-slate-400">* คลิกบนแผนที่เพื่อตั้งจุดกึ่งกลางโซนปลอดภัย</p>
      </div>

      {/* ฝั่งขวา: ข้อมูลสัตว์เลี้ยง */}
      <div className="w-full lg:w-1/3 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
        <div className="w-28 h-28 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-5xl font-bold mb-4 shadow-inner">
          {pet.name.charAt(0)}
        </div>
        <h3 className="text-3xl font-bold text-slate-800">{pet.name}</h3>
        <p className="text-slate-500 font-medium text-lg">{pet.type} • {pet.breed}</p>

        <div className="w-full mt-8 space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-sm text-slate-400 uppercase tracking-wider font-bold">พิกัดปัจจุบัน</p>
            <p className="text-xl font-mono font-bold text-slate-700 mt-1">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </p>
          </div>

          <div className={`p-4 rounded-2xl border transition-colors ${isInZone ? 'bg-teal-50 border-teal-100' : 'bg-red-50 border-red-100'}`}>
            <p className="text-sm uppercase tracking-wider font-bold text-slate-400">สถานะพื้นที่</p>
            <p className={`text-xl font-bold mt-1 ${isInZone ? 'text-teal-600' : 'text-red-600'}`}>
              {fenceCenter ? (isInZone ? "🟢 อยู่ในโซนปลอดภัย" : "🔴 ออกนอกโซนปลอดภัย!") : "⚪ ยังไม่ได้ตั้งค่าโซน"}
            </p>
          </div>
        </div>

        <div className="mt-auto w-full pt-6">
          <div className="text-xs text-center text-slate-300">
            อัปเดตข้อมูลล่าสุดเมื่อ: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Overview;