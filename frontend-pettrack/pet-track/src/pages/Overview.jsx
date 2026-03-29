import React, { useState, useEffect } from 'react'; // เพิ่ม useEffect
import Navbar from '../components/Navbar';
import MapSection from '../components/MapSection';
import PetCard from '../components/PetCard';
import PetInfo from '../components/PetInfo';

function Overview() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // 🌟 สร้าง State สำหรับเก็บข้อมูลสัตว์เลี้ยง
  const [petData, setPetData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🌟 ใช้ useEffect ดึงข้อมูลตอนเปิดหน้าเว็บ
  useEffect(() => {
    // ยิงไปที่ API Gateway (Vite Proxy จะแปลงเป็น http://localhost:8080/pets/ ให้อัตโนมัติ)
    // จำเป็นต้องมี credentials: 'include' เพื่อส่ง Cookie JWT ไปด้วย
    fetch('/pets/', { credentials: 'include' })
      .then(response => {
        if (!response.ok) {
          throw new Error('Unauthorized or Server Error');
        }
        return response.json();
      })
      .then(data => {
        // สมมติว่าดึงมาเป็น Array (ดึงตัวแรกมาโชว์ใน Overview ก่อน)
        if (data && data.length > 0) {
          const firstPet = data[0];
          setPetData({
            name: firstPet.Name,
            type: firstPet.Species,
            sex: firstPet.Gender,
            weight: 'N/A', // ถ้าไม่มีใน DB ให้ใส่ค่า Default
            age: `${firstPet.Age} year`,
            favoriteFood: 'N/A',
            // สมมติว่า Image เป็น Base64 หรือ URL (ถ้าคุณเก็บเป็น byte ใน DB ต้องแปลงก่อน)
            image: firstPet.Image ? `data:image/jpeg;base64,${firstPet.Image}` : 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500&h=400&fit=crop'
          });
        }
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching pets:", error);
        setLoading(false);
        // ถ้าขึ้น Error แนะนำให้ Redirect ไปหน้า Login
      });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e8dcc8' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="max-w-6xl mx-auto px-8 py-8">
        {activeTab === 'overview' && (
          <div className="mt-4">
            <div className="bg-yellow-100 rounded-3xl p-8 shadow-lg">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                  <MapSection />
                </div>
                <div className="lg:col-span-2 space-y-6">
                  {/* 🌟 เช็คก่อนว่ามีข้อมูลสัตว์เลี้ยงไหม */}
                  {petData ? (
                    <>
                      <PetCard petImage={petData.image} />
                      <PetInfo petData={petData} />
                    </>
                  ) : (
                    <div className="text-center p-8 bg-white rounded-2xl">
                      <p>No pets found. Please add a pet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'myPets' && (
          <div className="mt-4 p-8 bg-yellow-100 rounded-3xl text-center">
            <p className="text-gray-600 text-lg">My Pets section coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Overview;