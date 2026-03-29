// src/pages/MyPets.jsx
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import PetListingCard from '../components/PetListingCard';

// Using the warm color palette: background: #e8dcc8, main container: #fefbea
function MyPets() {
    const [activeTab, setActiveTab] = useState('myPets');

    // State for multiple pets
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);

    // useEffect to fetch multiple pets (currently using mock data as an array)
    // ลบ useEffect ตัวเก่าทิ้ง แล้วใช้ตัวนี้แทนครับ
    useEffect(() => {
        // 1. ยิง API ไปที่ Backend (ผ่าน Vite Proxy)
        fetch('/pets/', {
            method: 'GET',
            credentials: 'include' // สำคัญมาก! บังคับให้ส่ง Cookie JWT ไปด้วย
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch pets (อาจจะยังไม่ได้ล็อกอิน)');
                }
                return response.json();
            })
            .then(data => {
                // 2. ข้อมูลจาก Go (GORM) จะถูกส่งมาเป็น Array
                if (data && data.length > 0) {
                    // แปลงชื่อ Field ให้ตรงกับที่ Frontend ของเราใช้งาน
                    const formattedPets = data.map(pet => ({
                        name: pet.Name,
                        type: pet.Species,
                        sex: pet.Gender || 'Unknown',
                        weight: 'N/A', // ใน DB ของคุณยังไม่มีฟิลด์น้ำหนัก
                        age: pet.Age ? `${pet.Age} years` : 'Unknown',
                        favoriteFood: 'N/A',
                        status: 'HOME',
                        // 💡 สำคัญ: รูปภาพใน Go ถูกเก็บเป็น []byte (Base64)
                        // ต้องเติม 'data:image/jpeg;base64,' ข้างหน้าถึงจะแสดงรูปได้
                        image: pet.Image ? `data:image/jpeg;base64,${pet.Image}` : 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500&h=400&fit=crop'
                    }));

                    setPets(formattedPets); // เอาข้อมูลจริงใส่ลง State
                } else {
                    setPets([]); // ถ้าไม่มีสัตว์เลี้ยงเลย ให้เป็น Array ว่าง
                }
                setLoading(false);
            })
            .catch(error => {
                console.error("Error loading pets:", error);
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-[#e8dcc8]">
            <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="max-w-7xl mx-auto px-6 py-8 md:px-10 md:py-12">
                <div className="bg-[#fefbea] rounded-3xl p-8 md:p-10 shadow-lg space-y-8">
                    <div className="flex items-center justify-between border-b pb-6 border-slate-200">
                        <h1 className="text-5xl font-extrabold text-slate-800">My Pets</h1>
                        {/* Optional: Add a button to create a new pet */}
                        {/* <button className="px-6 py-3 rounded-full bg-teal-500 text-white text-base font-bold shadow-md hover:bg-teal-600 transition">
              + Add New Pet
            </button> */}
                    </div>

                    {loading ? (
                        <div className="min-h-96 flex items-center justify-center text-slate-600 text-lg font-semibold">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500 mr-3"></div>
                            Loading my pets...
                        </div>
                    ) : pets.length > 0 ? (
                        // Use a grid with responsive column counts to match listing view
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 pt-4">
                            {pets.map(pet => (
                                <PetListingCard key={pet.name} petData={pet} />
                            ))}
                        </div>
                    ) : (
                        <div className="min-h-96 flex items-center justify-center text-center p-10 bg-white rounded-3xl shadow-inner border-2 border-slate-100">
                            <div className="space-y-4">
                                <p className="text-7xl">🐾</p>
                                <p className="text-slate-600 text-xl font-semibold">No pets found. Please add a pet to get started.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MyPets;