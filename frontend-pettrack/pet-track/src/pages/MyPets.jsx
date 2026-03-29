import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PetListingCard from '../components/PetListingCard';

function MyPets() {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPets = async () => {
        try {
            const token = localStorage.getItem('token');
            // ยิงไปที่ API Gateway (localhost:8080/pets) ตามที่ตั้งไว้ใน proxy
            const res = await fetch('/pets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Backend คืนค่าเป็น Array เสมอ
                setPets(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPets();
    }, []);

    const handleDelete = async (petId) => {
        if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบข้อมูลสัตว์เลี้ยง?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/pets/${petId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setPets([]); // เคลียร์ State เพื่อให้ปุ่ม "เพิ่ม" กลับมาแสดง
                alert("ลบสำเร็จ");
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    if (loading) return <div className="p-10 text-center">กำลังโหลด...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">จัดการสัตว์เลี้ยง</h1>

                {/* แสดงปุ่มเพิ่ม เฉพาะเมื่อยังไม่มีสัตว์เลี้ยงเท่านั้น */}
                {pets.length === 0 && (
                    <Link to="/addpet" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium shadow-lg hover:bg-blue-700">
                        + เพิ่มสัตว์เลี้ยง
                    </Link>
                )}
            </div>

            {pets.length > 0 ? (
                <div className="max-w-md mx-auto">
                    {pets.map((pet) => (
                        <PetListingCard
                            key={pet.ID} // ใช้ ID ตัวใหญ่ตาม GORM Model
                            pet={pet}
                            onDelete={() => handleDelete(pet.ID)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed">
                    <p className="text-gray-500">คุณยังไม่มีสัตว์เลี้ยง เพิ่มข้อมูลเพื่อเริ่มติดตาม</p>
                </div>
            )}
        </div>
    );
}

export default MyPets;