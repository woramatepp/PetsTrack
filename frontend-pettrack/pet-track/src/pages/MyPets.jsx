import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PetListingCard from '../components/PetListingCard';

function MyPets() {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/pets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // ตรวจสอบว่าข้อมูลที่ได้มาเป็น Array และเก็บเฉพาะตัวแรก
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
        if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบสัตว์เลี้ยงตัวนี้?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/pets/${petId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setPets([]); // ลบเสร็จให้เคลียร์หน้าจอ เพื่อให้ปุ่ม "เพิ่ม" ปรากฏ
                alert("ลบข้อมูลสำเร็จ");
            }
        } catch (error) {
            alert("ไม่สามารถลบได้");
        }
    };

    if (loading) return <div className="text-center p-10">กำลังโหลด...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-slate-800">สัตว์เลี้ยงของฉัน</h1>
                {/* แสดงปุ่มเพิ่มเฉพาะตอนที่ยังไม่มีสัตว์เลี้ยง (pets.length === 0) */}
                {pets.length === 0 && (
                    <Link to="/addpet" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">
                        + เพิ่มสัตว์เลี้ยง
                    </Link>
                )}
            </div>

            {pets.length > 0 ? (
                <div className="max-w-md">
                    {pets.map((pet) => (
                        <PetListingCard
                            key={pet.ID}
                            pet={pet}
                            onDelete={() => handleDelete(pet.ID)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-500">คุณยังไม่มีสัตว์เลี้ยงในระบบ</p>
                </div>
            )}
        </div>
    );
}

export default MyPets;