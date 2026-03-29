import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function EditPet() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', type: '', breed: '' });

    useEffect(() => {
        const load = async () => {
            const token = localStorage.getItem('token');
            const res = await fetch('/pets', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            const pet = data.find(p => p.ID === parseInt(id));
            if (pet) setFormData({ name: pet.name, type: pet.type, breed: pet.breed });
        };
        load();
    }, [id]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const res = await fetch(`/pets/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            alert("แก้ไขสำเร็จ");
            navigate('/mypets');
        }
    };

    return (
        <div className="p-6 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">แก้ไขข้อมูลสัตว์เลี้ยง</h2>
            <form onSubmit={handleUpdate} className="space-y-4 bg-white p-6 rounded-2xl shadow border">
                <input type="text" value={formData.name} required className="w-full p-3 border rounded-xl"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                <input type="text" value={formData.type} required className="w-full p-3 border rounded-xl"
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })} />
                <input type="text" value={formData.breed} required className="w-full p-3 border rounded-xl"
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })} />
                <button type="submit" className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold">ยืนยันการแก้ไข</button>
            </form>
        </div>
    );
}

export default EditPet;