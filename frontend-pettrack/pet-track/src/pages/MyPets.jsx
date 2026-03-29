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
                setPets(Array.isArray(data) ? data : []);
            }
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPets(); }, []);

    const handleDelete = async (petId) => {
        if (!window.confirm("ต้องการลบสัตว์เลี้ยง?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/pets/${petId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setPets([]); // ลบแล้วปุ่มเพิ่มจะกลับมา
                alert("ลบสำเร็จ");
            }
        } catch (e) { alert("ลบไม่สำเร็จ"); }
    };

    if (loading) return <div className="p-10 text-center">กำลังโหลด...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">สัตว์เลี้ยงของฉัน</h1>
                {/* แสดงปุ่มเพิ่ม เฉพาะตอนไม่มีสัตว์เลี้ยงเท่านั้น */}
                {pets.length === 0 && (
                    <Link to="/addpet" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">
                        + เพิ่มสัตว์เลี้ยง
                    </Link>
                )}
            </div>

            {pets.length > 0 ? (
                <div className="max-w-md">
                    {pets.map((pet) => (
                        <PetListingCard key={pet.ID} pet={pet} onDelete={() => handleDelete(pet.ID)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed">
                    <p className="text-gray-500">ยังไม่มีข้อมูลสัตว์เลี้ยง</p>
                </div>
            )}
        </div>
    );
}

export default MyPets;