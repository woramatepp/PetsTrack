import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AddPet() {
    const navigate = useNavigate();

    useEffect(() => {
        const checkExistingPet = async () => {
            const token = localStorage.getItem('token');
            const res = await fetch('/pets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // 🌟 ถ้ามีสัตว์เลี้ยงอยู่แล้ว ให้ดีดกลับหน้าแรกทันที
                if (data && data.length > 0) {
                    alert("คุณมีสัตว์เลี้ยงในระบบอยู่แล้ว");
                    navigate('/');
                }
            }
        };
        checkExistingPet();
    }, [navigate]);

    return (
        
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">เพิ่มสัตว์เลี้ยงตัวใหม่</h2>
                <p className="text-center text-gray-500 mb-8">บอกเราหน่อยว่าเพื่อนซี้ของคุณคือตัวไหน</p>

                <form onSubmit={handleSubmit}>
                    {/* ส่วนที่ 1: เลือกประเภท */}
                    <div className="mb-8">
                        <label className="block text-gray-700 font-semibold mb-4 text-lg">1. เลือกประเภทสัตว์เลี้ยง</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {petTypes.map((type) => (
                                <div
                                    key={type.id}
                                    onClick={() => setSelectedType(type.id)}
                                    className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center justify-center transition-all duration-200 ${selectedType === type.id
                                        ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105'
                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-4xl mb-2">{type.icon}</span>
                                    <span className={`font-medium ${selectedType === type.id ? 'text-blue-600' : 'text-gray-600'}`}>
                                        {type.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ส่วนที่ 2: กรอกข้อมูล */}
                    <div className="mb-8 space-y-4">
                        <label className="block text-gray-700 font-semibold mb-2 text-lg">2. ข้อมูลทั่วไป</label>

                        <div>
                            <label className="block text-gray-600 text-sm mb-1">ชื่อสัตว์เลี้ยง <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="name"
                                value={petData.name}
                                onChange={handleInputChange}
                                required
                                placeholder="เช่น เจ้าตูบ, มอมแมม"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-600 text-sm mb-1">สายพันธุ์</label>
                                <input
                                    type="text"
                                    name="breed"
                                    value={petData.breed}
                                    onChange={handleInputChange}
                                    placeholder="เช่น ปอมเมอเรเนียน, เปอร์เซีย"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label className="block text-gray-600 text-sm mb-1">อายุ (ปี)</label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={petData.age}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-gray-600 text-sm mb-1">น้ำหนัก (กก.)</label>
                                    <input
                                        type="number"
                                        name="weight"
                                        value={petData.weight}
                                        onChange={handleInputChange}
                                        placeholder="0.0"
                                        step="0.1"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ปุ่ม Submit */}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition duration-300 shadow-md hover:shadow-lg"
                    >
                        บันทึกข้อมูลสัตว์เลี้ยง
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AddPet;