// src/pages/Overview.jsx
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MapSection from '../components/MapSection';
import PetCard from '../components/PetCard';
import PetInfo from '../components/PetInfo';

// src/pages/Overview.jsx
function Overview() {
  const [petData, setPetData] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/pets/', { credentials: 'include' });
        const data = await res.json();
        if (data && data.length > 0) {
          const p = data[0];
          setPetData({ name: p.Name, type: p.Species, sex: p.Gender, age: p.Age, image: p.Image ? `data:image/jpeg;base64,${p.Image}` : '' });

          // 🌟 ดึงตำแหน่งจาก Tracking DB (ผ่าน Gateway)
          const trackRes = await fetch(`/tracking/${p.ID}`, { credentials: 'include' });
          if (trackRes.ok) setLocation(await trackRes.json());
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#e8dcc8]">
      <Navbar />
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-yellow-100 rounded-3xl p-8 shadow-lg grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <MapSection petLocation={location} /> {/* 🌟 ส่งพิกัดให้แผนที่ */}
          </div>
          <div className="lg:col-span-2 space-y-6">
            {petData && (
              <>
                <PetCard petImage={petData.image} />
                <PetInfo petData={petData} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}