import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AddPet() {
    const [formData, setFormData] = useState({ name: '', type: '', breed: '' });
    const navigate = useNavigate();

    // เช็คว่ามีอยู่แล้วหรือยัง ถ้ามีให้ดีดออก
    useEffect(() => {
        const check = async () => {
            const token = localStorage.getItem('token');
            const res = await fetch('/pets', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data && data.length > 0) navigate('/mypets');
        };
        check();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            alert("เพิ่มสำเร็จ");
            navigate('/mypets');
        } else {
            alert("เพิ่มไม่สำเร็จ (อาจมีสัตว์เลี้ยงอยู่แล้ว)");
        }
    };

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">เพิ่มสัตว์เลี้ยง</h2>
            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-2xl shadow border">
                <input type="text" placeholder="ชื่อ" required className="w-full p-3 border rounded-xl"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                <input type="text" placeholder="ประเภท" required className="w-full p-3 border rounded-xl"
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })} />
                <input type="text" placeholder="สายพันธุ์" required className="w-full p-3 border rounded-xl"
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })} />
                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">บันทึกข้อมูล</button>
            </form>
        </div>
    );
}

export default AddPet;