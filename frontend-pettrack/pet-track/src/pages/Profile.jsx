import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, TextCursorInput, Camera, Loader2, CheckCircle } from 'lucide-react';

function Profile() {
    const { user, checkLoggedIn } = useAuth();
    const fileInputRef = useRef(null);

    // State สำหรับฟอร์ม (ค่าเริ่มต้นจากข้อมูล user ปัจจุบัน)
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [address, setAddress] = useState(user?.address || '');
    const [description, setDescription] = useState(user?.description || '');

    const [loading, setLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // ฟังก์ชันช่วยแสดงรูปโปรไฟล์ในหน้าแก้ไข
    const renderBigAvatar = () => {
        if (user && user.avatar_url) {
            return <img src={user.avatar_url} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl" />;
        }
        return (
            <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-xl">
                <User className="w-16 h-16 text-slate-400" />
            </div>
        );
    };

    // จัดการอัปโหลดรูป (เมื่อเลือกไฟล์)
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // ตรวจสอบขนาดไฟล์ (เช่น ไม่เกิน 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'ขนาดไฟล์ต้องไม่เกิน 2MB' });
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        setAvatarLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('/user/profile/avatar', {
                method: 'POST',
                // credentials: 'include', // สำคัญ!
                body: formData // ห้ามตั้ง Content-Type เอง เบราว์เซอร์จะจัดการให้
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'อัปโหลดรูปโปรไฟล์สำเร็จ' });
                await checkLoggedIn(); // ดึงข้อมูล user ใหม่เพื่อให้รูปใน Navbar อัปเดต
            } else {
                throw new Error(data.error || 'Failed to upload image');
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setAvatarLoading(false);
            // ล้างค่าใน input file เพื่อให้เลือกไฟล์เดิมซ้ำได้
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // จัดการยื่นฟอร์มแก้ไขข้อมูลส่วนตัว
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('/user/profile', {
                method: 'PUT',
                // credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, address, description })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'อัปเดตข้อมูลโปรไฟล์สำเร็จ' });
                await checkLoggedIn(); // ดึงข้อมูล user ใหม่
            } else {
                throw new Error(data.error || 'Failed to update profile');
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    // CSS Class ซ้ำๆ
    const inputClass = "w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-teal-200 transition";
    const iconClass = "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400";
    const labelClass = "text-sm font-semibold text-slate-600 block mb-1.5 ml-1";

    return (
        <div className="min-h-screen bg-[#e8dcc8] p-6 md:p-10 text-slate-800">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header & Avatar */}
                <div className="bg-[#fefbea] rounded-3xl p-8 shadow-lg flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                    {/* ลายน้ำพื้นหลัง */}
                    <User className="absolute -right-10 -bottom-10 w-64 h-64 text-slate-100 rotate-12" />

                    <div className="relative group z-10">
                        {renderBigAvatar()}
                        {avatarLoading && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                        )}
                        {/* ปุ่มกลมๆ สำหรับกดอัพรูป */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-1 right-1 bg-teal-500 text-white p-3 rounded-full shadow-lg hover:bg-teal-600 transition"
                            title="เปลี่ยนรูปโปรไฟล์"
                            disabled={avatarLoading}
                        >
                            <Camera className="w-5 h-5" />
                        </button>
                        {/* Input File ซ่อนอยู่ */}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png" className="hidden" />
                    </div>

                    <div className="text-center md:text-left z-10 space-y-2">
                        <h1 className="text-4xl font-extrabold text-slate-900">แก้ไขข้อมูลส่วนตัว</h1>
                        <p className="text-xl text-slate-600">จัดการข้อมูลและรูปภาพของคุณ</p>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200 text-sm font-medium text-slate-700">
                            <Mail className="w-4 h-4 text-teal-500" />
                            {user?.email} (แก้ไขไม่ได้)
                        </div>
                    </div>
                </div>

                {/* แสดงข้อความแจ้งเตือน */}
                {message.text && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 font-bold ${message.type === 'success' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
                        {message.type === 'success' && <CheckCircle className="w-6 h-6" />}
                        {message.text}
                    </div>
                )}

                {/* Form แก้ไขข้อมูล */}
                <form onSubmit={handleSubmit} className="bg-[#fefbea] rounded-3xl p-8 md:p-10 shadow-lg grid md:grid-cols-2 gap-x-8 gap-y-6 z-10 relative">

                    {/* ชื่อ */}
                    <div className="space-y-1">
                        <label className={labelClass}>ชื่อ-นามสกุล</label>
                        <div className="relative">
                            <User className={iconClass} />
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="สมชาย ใจดี" />
                        </div>
                    </div>

                    {/* เบอร์โทร */}
                    <div className="space-y-1">
                        <label className={labelClass}>เบอร์โทรศัพท์</label>
                        <div className="relative">
                            <Phone className={iconClass} />
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="0812345678" />
                        </div>
                    </div>

                    {/* ที่อยู่ */}
                    <div className="space-y-1 md:col-span-2">
                        <label className={labelClass}>ที่อยู่</label>
                        <div className="relative">
                            <MapPin className={`${iconClass} top-5 translate-y-0`} />
                            <textarea value={address} onChange={(e) => setAddress(e.target.value)} className={`${inputClass} pl-12 h-24 pt-3 resize-none`} placeholder="123/4 หมู่ 5 ต.เมือง อ.เมือง จ.เชียงใหม่ 50000"></textarea>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1 md:col-span-2">
                        <label className={labelClass}>รายละเอียดเพิ่มเติม (Description)</label>
                        <div className="relative">
                            <TextCursorInput className={`${iconClass} top-5 translate-y-0`} />
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} pl-12 h-32 pt-3 resize-none`} placeholder="บอกเล่าเรื่องราวของคุณเล็กน้อย..."></textarea>
                        </div>
                    </div>

                    {/* ปุ่มบันทึก */}
                    <div className="md:col-span-2 pt-4 border-t border-slate-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-2.5 px-10 py-3.5 rounded-xl bg-teal-500 text-white font-bold text-lg hover:bg-teal-600 transition shadow disabled:bg-teal-300"
                        >
                            {loading ? (
                                <><Loader2 className="w-6 h-6 animate-spin" /> กำลังบันทึก...</>
                            ) : (
                                'บันทึกข้อมูล'
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default Profile;