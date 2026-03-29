import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AddPet() {
    const [formData, setFormData] = useState({ name: '', type: '', breed: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/pets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert("เพิ่มสัตว์เลี้ยงสำเร็จ!");
                navigate('/mypets');
            } else {
                const err = await res.json();
                alert(err.error || "ไม่สามารถเพิ่มได้");
            }
        } catch (error) {
            console.error("Add error:", error);
        }
    };

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">ลงทะเบียนสัตว์เลี้ยง</h2>
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">ชื่อสัตว์เลี้ยง</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="เช่น น้องถุงทอง" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">ประเภท</label>
                    <input type="text" required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="เช่น สุนัข หรือ แมว" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">สายพันธุ์</label>
                    <input type="text" required value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="เช่น โกลเด้น" />
                </div>
                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 shadow-md transition-all">
                    บันทึกข้อมูล
                </button>
            </form>
        </div>
    );
}

export default AddPet;