import React, { useState, useEffect } from 'react';

function Overview() {
  const [pet, setPet] = useState(null);
  const [location, setLocation] = useState({ lat: 13.7563, lng: 100.5018 });
  const [loading, setLoading] = useState(true);

  // ขั้นตอนที่ 1: ดึงข้อมูลสัตว์เลี้ยงเมื่อโหลดหน้าเว็บ
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
            setPet(data[0]); // เก็บข้อมูลสัตว์เลี้ยงตัวแรก (1 บัญชีต่อ 1 ตัว)
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchPetData();
  }, []);

  // ขั้นตอนที่ 2: เมื่อมีข้อมูล pet แล้ว ให้ดึงพิกัดล่าสุดทุกๆ 5 วินาที (Polling)
  useEffect(() => {
    if (!pet) return;

    const fetchLocation = async () => {
      try {
        const token = localStorage.getItem('token');
        // ส่ง ID ของสัตว์เลี้ยงไปที่ Tracking Service (ใช้ ID ตัวใหญ่ตาม format GORM)
        const res = await fetch(`/tracking/latest?pet_id=${pet.ID || pet.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLocation({ lat: data.latitude, lng: data.longitude });
        }
      } catch (e) { console.error("Update fail:", e); }
    };

    fetchLocation(); // ดึงทันที
    const interval = setInterval(fetchLocation, 5000); // ดึงซ้ำทุก 5 วินาทีเพื่อให้หมุดขยับ
    return () => clearInterval(interval);
  }, [pet]);

  if (loading) return <div className="p-10 text-center">กำลังโหลด...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
      <div className="flex-1 bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col min-h-[500px]">
        <h2 className="text-xl font-bold mb-4">ตำแหน่งปัจจุบัน</h2>
        <div className="flex-1 rounded-2xl overflow-hidden relative bg-slate-100">
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`}
          ></iframe>
        </div>
      </div>

      {/* ส่วน Card แสดงข้อมูลสัตว์เลี้ยงข้างแผนที่ */}
      {pet && (
        <div className="w-full lg:w-1/3 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="text-center">
            <div className="w-24 h-24 bg-teal-50 text-teal-600 rounded-full mx-auto flex items-center justify-center text-4xl font-bold mb-4">
              {pet.name.charAt(0)}
            </div>
            <h3 className="text-2xl font-bold">{pet.name}</h3>
            <p className="text-slate-500">{pet.type} • {pet.breed}</p>
            <div className="mt-6 p-4 bg-slate-50 rounded-xl text-left">
              <p className="text-sm text-slate-400">พิกัดล่าสุด:</p>
              <p className="font-mono font-bold">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Overview;