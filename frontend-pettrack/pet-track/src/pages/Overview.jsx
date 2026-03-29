import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet'; // สำหรับตั้งค่า Icon
import { MapPin, PawPrint, CheckCircle } from 'lucide-react';

// แก้บัค Icon ของ Leaflet ไม่แสดงใน React
// โดยการชี้ Link ไปดึงรูป Icon มาตรฐาน
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// สร้างฟังก์ชันสำหรับสร้าง Icon พิเศษ (เช่น เอาหมุดสีteal)
const createTealIcon = () => new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-teal.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function Overview() {
  const { user } = useAuth();
  const location = useLocation(); // สำหรับรับข้อความแจ้งเตือนจากหน้า AddPet

  const [pets, setPets] = useState([]); // เก็บข้อมูลพิกัดสัตว์เลี้ยง
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  // พิกัดเริ่มต้นแผนที่ (เช่น กลาง กทม.)
  const mapCenter = [13.7563, 100.5018];
  const zoomLevel = 11;

  // ดึงข้อมูลพิกัดเมื่อเปิดหน้า
  useEffect(() => {
    fetchPetLocations();

    // เช็คว่ามีข้อความแจ้งเตือนแนบมาไหม
    if (location.state && location.state.message) {
      setSuccessMessage(location.state.message);
      // ล้าง state เพื่อไม่ให้ข้อความค้างเมื่อ reload
      window.history.replaceState({}, document.title);
      // ซ่อนข้อความหลัง 5 วิ
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [location]);

  const fetchPetLocations = async () => {
    setLoading(true);
    try {
      // เรียก API ที่ Gateway (Gateway จะส่งต่อให้ Pet Service)
      // Route นี้ตั้งไว้ให้ RequireAuth
      const response = await fetch('/pets/locations', {
        // credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPets(data);
      }
    } catch (error) {
      console.error("Failed to fetch pet locations:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e8dcc8] text-slate-800">

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-24 right-6 z-[2000] bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-bold animate-bounce">
          <CheckCircle className="w-6 h-6" />
          {successMessage}
        </div>
      )}

      <main className="p-6 md:p-10 space-y-8">

        {/* Header */}
        <header className="bg-[#fefbea] p-8 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
          <MapPin className="absolute -left-10 -bottom-10 w-48 h-48 text-slate-100" />
          <div className="relative z-10 text-center md:text-left">
            <h1 className="text-4xl font-extrabold text-slate-900">ระบบติดตามสัตว์เลี้ยง</h1>
            <p className="text-xl text-slate-600">ดูตำแหน่งล่าสุดของสมาชิกครอบครัวตัวน้อยแบบ Real-time</p>
          </div>
          {user && (
            <div className="relative z-10 p-4 bg-white rounded-2xl border border-slate-100 shadow-inner flex items-center gap-3">
              <PawPrint className="w-10 h-10 text-teal-500" />
              <div>
                <div className="text-sm text-slate-500">สัตว์เลี้ยงภายใต้การดูแล</div>
                <div className="text-3xl font-black text-slate-900">{pets.length} ตัว</div>
              </div>
            </div>
          )}
        </header>

        {/* แผนที่ (Leaflet) */}
        <section className="bg-white p-2 rounded-3xl shadow-xl border-4 border-white relative z-10 overflow-hidden">
          <div className="h-[calc(100vh-250px)] min-h-[400px] rounded-2xl overflow-hidden">

            {/* Component หลักของ Map */}
            <MapContainer center={mapCenter} zoom={zoomLevel} scrollWheelZoom={true} className="h-full w-full">

              {/* Layer พื้นหลังแผนที่ (ใช้ OpenStreetMap) */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* แสดงหมุดสำหรับสัตว์เลี้ยงแต่ละตัว */}
              {pets.map(pet => (
                <Marker
                  key={pet.id}
                  position={[pet.latitude, pet.longitude]}
                  icon={createTealIcon()} // ใช้ Icon สี teal
                >
                  {/* ป๊อปอัปเมื่อคลิกหมุด */}
                  <Popup className="pet-popup">
                    <div className="text-center space-y-2 p-1">
                      {pet.image_url ? (
                        <img src={pet.image_url} alt={pet.name} className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-teal-100" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                          <PawPrint className="w-10 h-10" />
                        </div>
                      )}
                      <div className="font-bold text-lg text-slate-900">{pet.name}</div>
                      <div className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold inline-block">
                        {pet.type}
                      </div>
                      <div className="text-xs text-slate-500 pt-1">
                        พิกัด: {pet.latitude.toFixed(4)}, {pet.longitude.toFixed(4)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/80 z-[1001] flex items-center justify-center">
                <div className="text-center space-y-3 text-teal-600">
                  <PawPrint className="w-12 h-12 animate-pulse mx-auto" />
                  <div className="font-bold text-lg">กำลังโหลดแผนที่และพิกัด...</div>
                </div>
              </div>
            )}

            {/* Overlay เมื่อไม่ได้ล็อกอิน (UI เสริม) */}
            {!user && !loading && (
              <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-10 md:w-96 bg-[#fefbea]/95 p-6 rounded-2xl shadow-2xl z-[1001] border border-white backdrop-blur-sm space-y-3">
                <MapPin className="w-10 h-10 text-teal-500" />
                <h3 className="text-xl font-bold text-slate-900">ล็อกอินเพื่อดูตำแหน่ง</h3>
                <p className="text-slate-600">คุณต้องเข้าสู่ระบบเพื่อดูพิกัด Real-time ของสัตว์เลี้ยงและจัดการข้อมูลสมาชิกครอบครัวของคุณ</p>
                <a href="/login" className="block text-center w-full py-3 rounded-xl bg-teal-500 text-white font-bold hover:bg-teal-600 transition">
                  เข้าสู่ระบบตอนนี้
                </a>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Overview;