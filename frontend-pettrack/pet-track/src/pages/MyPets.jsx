import { useState, useEffect } from 'react';

function MyPets() {
    const [pet, setPet] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', type: '', breed: '', age: '', weight: '' });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchPet = async () => {
            try {
                const token = localStorage.getItem('token');
                // ดึงข้อมูลสัตว์เลี้ยงทั้งหมด
                const response = await fetch('/pets', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    // ถ้าใน DB มีข้อมูลสัตว์เลี้ยง ดึงตัวแรกมาใช้งาน (ตามโจทย์Overview)
                    if (data && data.length > 0) {
                        setPet(data[0]);
                    }
                }
            } catch (err) {
                console.error('Error fetching pet:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPet();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        // แปลงค่า age และ weight ให้เป็นตัวเลขตามโครงสร้าง Database
        const payload = {
            ...formData,
            age: parseInt(formData.age) || 0,
            weight: parseFloat(formData.weight) || 0
        };

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/pets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'ไม่สามารถบันทึกข้อมูลได้');
            }

            const savedPet = await response.json();
            setPet(savedPet); // นำข้อมูลที่เซฟเสร็จมาแสดงเป็นโปรไฟล์ทันที
            setIsAdding(false); // ปิดหน้าฟอร์ม
            setSuccessMessage('เพิ่มโปรไฟล์สัตว์เลี้ยงสำเร็จ!');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500">กำลังโหลด...</div>;

    // สถานะที่ 1: ถ้ามีสัตว์เลี้ยงแล้วให้โชว์หน้าโปรไฟล์
    if (pet && !isAdding) {
        return (
            <div className="max-w-2xl mx-auto mt-12 p-8 bg-white rounded-3xl shadow-sm border border-slate-100">

                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl text-sm font-semibold text-center border border-green-100">
                        {successMessage}
                    </div>
                )}

                <div className="flex flex-col md:flex-row items-center gap-8 mb-8 border-b border-slate-100 pb-8">
                    {/* รูปโปรไฟล์สัตว์เลี้ยง (ใช้ตัวอักษรตัวแรกของชื่อแทนรูปภาพ) */}
                    <div className="w-32 h-32 bg-teal-50 rounded-full flex items-center justify-center text-5xl text-teal-600 font-black shadow-inner">
                        {pet.name ? pet.name.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-4xl font-extrabold text-slate-800">{pet.name}</h2>
                        <p className="text-lg text-slate-500 mt-2 font-medium">
                            {pet.type} {pet.breed ? `• ${pet.breed}` : ''}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="block text-sm text-slate-400 font-semibold mb-1">อายุ</span>
                        <span className="text-2xl font-bold text-slate-700">
                            {pet.age || '-'} <span className="text-lg text-slate-500 font-normal">ปี</span>
                        </span>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="block text-sm text-slate-400 font-semibold mb-1">น้ำหนัก</span>
                        <span className="text-2xl font-bold text-slate-700">
                            {pet.weight || '-'} <span className="text-lg text-slate-500 font-normal">กก.</span>
                        </span>
                    </div>
                </div>

                <div className="mt-8 text-center text-sm text-slate-400">
                    ข้อมูลนี้จะไปแสดงในหน้า Overview ข้างๆ แผนที่
                </div>
            </div>
        );
    }

    // สถานะที่ 2: ถ้ายังไม่มีสัตว์เลี้ยง โชว์ปุ่มตรงกลางจอ
    if (!pet && !isAdding) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6 p-6">
                <div className="w-32 h-32 bg-teal-50 rounded-full flex items-center justify-center shadow-inner">
                    <svg className="w-16 h-16 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4"></path></svg>
                </div>
                <div className="text-center max-w-sm">
                    <h2 className="text-3xl font-extrabold text-slate-800">ต้อนรับสู่ PetTrack!</h2>
                    <p className="text-slate-500 mt-3 text-lg">เริ่มต้นใช้งานโดยการเพิ่มข้อมูลโปรไฟล์ของเพื่อนซี้ของคุณ เพื่อให้เราช่วยดูแลและติดตามตำแหน่งได้</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="mt-6 px-12 py-4 bg-teal-500 text-white rounded-full font-bold text-lg hover:bg-teal-600 transition shadow-lg shadow-teal-500/30"
                >
                    เพิ่มข้อมูลสัตว์เลี้ยง
                </button>
            </div>
        );
    }

    // สถานะที่ 3: หน้าฟอร์มกรอกข้อมูล
    return (
        <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-3xl shadow-sm border border-slate-100 mb-10">
            <h2 className="text-3xl font-extrabold mb-10 text-slate-800 text-center">สร้างโปรไฟล์สัตว์เลี้ยง</h2>

            {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold text-center border border-red-100">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">ชื่อสัตว์เลี้ยง <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:ring-2 focus:ring-teal-300 focus:bg-white outline-none transition" placeholder="เช่น บราวนี่" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">ประเภท <span className="text-red-500">*</span></label>
                        <input type="text" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:ring-2 focus:ring-teal-300 focus:bg-white outline-none transition" placeholder="เช่น สุนัข, แมว" required />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">สายพันธุ์</label>
                        <input type="text" value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:ring-2 focus:ring-teal-300 focus:bg-white outline-none transition" placeholder="เช่น ปั๊ก" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">อายุ (ปี)</label>
                        <input type="number" min="0" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:ring-2 focus:ring-teal-300 focus:bg-white outline-none transition" placeholder="0" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">น้ำหนัก (กก.)</label>
                        <input type="number" step="0.1" min="0" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:ring-2 focus:ring-teal-300 focus:bg-white outline-none transition" placeholder="0.0" />
                    </div>
                </div>

                <div className="flex gap-4 mt-12 pt-6 border-t border-slate-100">
                    <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-full font-bold hover:bg-slate-200 transition">
                        ยกเลิก
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 py-4 bg-teal-500 text-white rounded-full font-bold hover:bg-teal-600 transition disabled:bg-teal-300 shadow-lg shadow-teal-500/20">
                        {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default MyPets;