import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, CheckCircle, Loader2, UploadCloud, Cat, Dog, Bird, Rabbit, Mouse } from 'lucide-react';

// ตัวเลือกประเภทสัตว์เลี้ยง พร้อม Icon
const petTypes = [
    { id: 'หมา', name: 'สุนัข', icon: Dog },
    { id: 'แมว', name: 'แมว', icon: Cat },
    { id: 'นก', name: 'นก', icon: Bird },
    { id: 'กระต่าย', name: 'กระต่าย', icon: Rabbit },
    { id: 'หนู', name: 'หนูแฮมสเตอร์', icon: Mouse },
];

function AddPet() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // State สำหรับฟอร์ม
    const [name, setName] = useState('');
    const [type, setType] = useState(''); // เก็บ id เช่น 'หมา'
    const [gender, setGender] = useState('ผู้'); // default
    const [age, setAge] = useState(1);
    const [weight, setWeight] = useState(5.0);
    const [notes, setNotes] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // จัดการการเลือกรูปภาพ (Preview)
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError('ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB');
            return;
        }

        setImageFile(file);
        // สร้าง Object URL สำหรับแสดงรูปตัวอย่าง
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
        setError('');
    };

    // จัดการยื่นฟอร์ม (Multipart/FormData)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!type) {
            setError('กรุณาเลือกประเภทสัตว์เลี้ยง');
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('type', type);
        formData.append('gender', gender);
        formData.append('age', age);
        formData.append('weight', weight);
        formData.append('notes', notes);

        if (imageFile) {
            formData.append('image', imageFile);
        }

        setLoading(true);

        try {
            const response = await fetch('/pets/', {
                method: 'POST',
                // credentials: 'include',
                // ห้ามตั้ง Content-Type เอง
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                // สำเร็จ -> ไปหน้า Overview เพื่อดูหมุด
                navigate('/', { state: { message: 'ลงทะเบียนสัตว์เลี้ยงสำเร็จ' } });
            } else {
                throw new Error(data.error || 'Failed to create pet profile');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // CSS Class ซ้ำๆ
    const inputClass = "w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-teal-200 transition";
    const labelClass = "text-sm font-semibold text-slate-700 block mb-1.5 ml-1";

    return (
        <div className="min-h-screen bg-[#e8dcc8] p-6 md:p-10 text-slate-800">
            <div className="max-w-5xl mx-auto space-y-10">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm text-teal-600">
                        <PawPrint className="w-6 h-6" />
                        <span className="text-lg font-bold">New Family Member</span>
                    </div>
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tighter">ลงทะเบียนสัตว์เลี้ยง</h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">เพิ่มข้อมูลพื้นฐานของสัตว์เลี้ยงตัวใหม่ของคุณเพื่อเริ่มการติดตาม</p>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-red-100 text-red-900 font-bold text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-8">

                    {/* ฝั่งซ้าย: อัพรูป (UI เหมือนในรูปตัวอย่าง) */}
                    <div className="bg-[#fefbea] rounded-3xl p-8 shadow-lg space-y-6 md:col-span-1">
                        <label className={`${labelClass} text-center text-lg`}>รูปถ่ายสัตว์เลี้ยง</label>

                        <div
                            className="aspect-square w-full rounded-3xl border-4 border-dashed border-slate-200 bg-white overflow-hidden relative group cursor-pointer hover:border-teal-300 transition flex items-center justify-center"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-6 space-y-3 text-slate-400">
                                    <UploadCloud className="w-16 h-16 mx-auto" />
                                    <span className="font-medium block">คลิกเพื่ออัปโหลดรูป</span>
                                    <span className="text-xs">(JPG, PNG ไม่เกิน 5MB)</span>
                                </div>
                            )}
                            {/* Overlay เมื่อ Hover */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold">
                                เปลี่ยนรูป
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png" className="hidden" />

                        <p className="text-sm text-slate-500 text-center bg-white p-4 rounded-xl border border-slate-100">
                            รูปถ่ายที่ชัดเจนจะช่วยให้จำแนกสัตว์เลี้ยงได้ง่ายขึ้นเมื่อดูกล้องหรือแชร์ข้อมูล
                        </p>
                    </div>

                    {/* ฝั่งขวา: ข้อมูล (UI เหมือนในรูปตัวอย่าง) */}
                    <div className="bg-[#fefbea] rounded-3xl p-8 md:p-10 shadow-lg space-y-6 md:col-span-2 relative overflow-hidden">
                        {/* ลายน้ำพื้นหลัง */}
                        <PawPrint className="absolute -right-10 -bottom-10 w-64 h-64 text-slate-100/50 rotate-12" />

                        <div className="grid md:grid-cols-2 gap-6 relative z-10">
                            {/* ชื่อ */}
                            <div className="space-y-1 md:col-span-2">
                                <label className={labelClass}>ชื่อสัตว์เลี้ยง <span className="text-red-500">*</span></label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="เช่น มอมแมม, คุกกี้" required />
                            </div>

                            {/* ประเภท (Grid เลือกแบบในรูป) */}
                            <div className="space-y-3 md:col-span-2">
                                <label className={labelClass}>ประเภทสัตว์เลี้ยง <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                    {petTypes.map(pet => {
                                        const Icon = pet.icon;
                                        const isSelected = type === pet.id;
                                        return (
                                            <button
                                                key={pet.id}
                                                type="button"
                                                onClick={() => setType(pet.id)}
                                                className={`p-4 rounded-2xl border-2 transition flex flex-col items-center gap-2 text-center h-full ${isSelected ? 'bg-teal-50 border-teal-400 text-teal-700 shadow-inner' : 'bg-white border-slate-100 hover:border-teal-200'}`}
                                            >
                                                <Icon className={`w-10 h-10 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                                                <span className="font-semibold text-sm">{pet.name}</span>
                                                {isSelected && <CheckCircle className="w-5 h-5 text-teal-500 absolute top-2 right-2" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* เพศ (แบบในรูป) */}
                            <div className="space-y-2 md:col-span-2">
                                <label className={labelClass}>เพศ</label>
                                <div className="flex gap-3">
                                    {['ผู้', 'เมีย'].map(g => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setGender(g)}
                                            className={`flex-1 px-6 py-3 rounded-full border-2 font-bold transition ${gender === g ? 'bg-teal-500 text-white border-teal-600 shadow-md' : 'bg-white border-slate-200 text-slate-700 hover:border-teal-300'}`}
                                        >
                                            เพศ{g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* อายุ (Slider แบบในรูป) */}
                            <div className="space-y-1">
                                <label className={`${labelClass} flex justify-between`}>
                                    <span>อายุ</span>
                                    <span className="font-bold text-teal-600 text-base">{age} ปี</span>
                                </label>
                                <input type="range" min="0" max="30" value={age} onChange={(e) => setAge(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-500" />
                                <div className="flex justify-between text-xs text-slate-400 px-1"><span>0</span><span>15</span><span>30+</span></div>
                            </div>

                            {/* น้ำหนัก (Slider แบบในรูป) */}
                            <div className="space-y-1">
                                <label className={`${labelClass} flex justify-between`}>
                                    <span>น้ำหนัก</span>
                                    <span className="font-bold text-teal-600 text-base">{weight.toFixed(1)} กก.</span>
                                </label>
                                <input type="range" min="0.1" max="100" step="0.1" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-500" />
                                <div className="flex justify-between text-xs text-slate-400 px-1"><span>0.1</span><span>50</span><span>100+</span></div>
                            </div>

                            {/* หมายเหตุ */}
                            <div className="space-y-1 md:col-span-2">
                                <label className={labelClass}>หมายเหตุ / ข้อมูลเพิ่มเติม</label>
                                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} h-28 resize-none`} placeholder="เช่น โรคประจำตัว, ประวัติวัคซีน, ลักษณะนิสัย..."></textarea>
                            </div>
                        </div>

                        {/* ปุ่มสร้าง */}
                        <div className="pt-6 border-t border-slate-100 flex justify-end relative z-10">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center gap-2.5 px-12 py-4 rounded-full bg-teal-500 text-white font-bold text-xl hover:bg-teal-600 transition shadow-lg disabled:bg-teal-300"
                            >
                                {loading ? (
                                    <><Loader2 className="w-7 h-7 animate-spin" /> กำลังสร้าง...</>
                                ) : (
                                    'Create Pet Profile'
                                )}
                            </button>
                        </div>
                    </div>
                </form>

            </div>
        </div>
    );
}

export default AddPet;