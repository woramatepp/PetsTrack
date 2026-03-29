import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function EditPet() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', type: '', breed: '' });

    useEffect(() => {
        const fetchPet = async () => {
            const token = localStorage.getItem('token');
            const res = await fetch('/pets', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                const currentPet = data.find(p => p.ID === parseInt(id));
                if (currentPet) setFormData(currentPet);
            }
        };
        fetchPet();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            // ยิง PUT /pets/:id ไปที่ pet-management service
            const res = await fetch(`/pets/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                alert("แก้ไขข้อมูลสำเร็จ");
                navigate('/mypets');
            }
        } catch (error) {
            console.error("Update error:", error);
        }
    };

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">แก้ไขข้อมูลสัตว์เลี้ยง</h1>
            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-8 rounded-3xl shadow-sm border">
                <div>
                    <label className="block text-sm font-medium mb-1">ชื่อสัตว์เลี้ยง</label>
                    <input
                        type="text" required value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-3 rounded-xl border border-gray-200"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">ประเภท (เช่น สุนัข, แมว)</label>
                    <input
                        type="text" required value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full p-3 rounded-xl border border-gray-200"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">สายพันธุ์</label>
                    <input
                        type="text" required value={formData.breed}
                        onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                        className="w-full p-3 rounded-xl border border-gray-200"
                    />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">
                    บันทึกการเปลี่ยนแปลง
                </button>
            </form>
        </div>
    );
}

export default EditPet;