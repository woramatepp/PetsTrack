import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function EditPet() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', type: '', breed: '' });

    useEffect(() => {
        const fetchCurrentPet = async () => {
            const token = localStorage.getItem('token');
            const res = await fetch('/pets', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                const found = data.find(p => p.ID === parseInt(id));
                if (found) setFormData({ name: found.name, type: found.type, breed: found.breed });
            }
        };
        fetchCurrentPet();
    }, [id]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/pets/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                alert("อัปเดตข้อมูลสำเร็จ");
                navigate('/mypets');
            }
        } catch (error) {
            console.error("Update error:", error);
        }
    };

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">แก้ไขข้อมูล</h2>
            <form onSubmit={handleUpdate} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">ชื่อสัตว์เลี้ยง</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">ประเภท</label>
                    <input type="text" required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">สายพันธุ์</label>
                    <input type="text" required value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                </div>
                <button type="submit" className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all">
                    ยืนยันการแก้ไข
                </button>
            </form>
        </div>
    );
}

export default EditPet;