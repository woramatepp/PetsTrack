import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function Profile() {
    const { user, setUser } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        address: user?.address || '',
        description: user?.description || '',
    });
    const [imagePreview, setImagePreview] = useState(user?.profileImage || null);
    const [imageFile, setImageFile] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // 1. สร้าง FormData เพื่อส่งรูปภาพและข้อมูลไป API
        // const data = new FormData();
        // data.append('name', formData.name); ...
        // data.append('image', imageFile);
        // 2. ยิง API อัปเดตข้อมูลที่นี่ (fetch / axios)

        // จำลองการอัปเดต Context (เมื่อ API สำเร็จ)
        const updatedUser = { ...user, ...formData, profileImage: imagePreview };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        alert('บันทึกข้อมูลสำเร็จ');
    };

    return (
        <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
            <h2 className="text-2xl font-bold mb-6">แก้ไขข้อมูลส่วนตัว</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col items-center mb-4">
                    <img
                        src={imagePreview || "/default-avatar.png"}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover mb-2"
                    />
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                </div>

                <div>
                    <label className="block text-gray-700">Email (ไม่สามารถแก้ไขได้)</label>
                    <input type="email" value={user?.email || 'user@email.com'} disabled className="w-full border p-2 rounded bg-gray-100" />
                </div>

                <div>
                    <label className="block text-gray-700">ชื่อ-นามสกุล</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>

                <div>
                    <label className="block text-gray-700">เบอร์โทรศัพท์</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>

                <div>
                    <label className="block text-gray-700">ที่อยู่</label>
                    <textarea name="address" value={formData.address} onChange={handleChange} className="w-full border p-2 rounded" rows="3"></textarea>
                </div>

                <div>
                    <label className="block text-gray-700">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} className="w-full border p-2 rounded" rows="3"></textarea>
                </div>

                <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                    บันทึกข้อมูล
                </button>
            </form>
        </div>
    );
}

export default Profile;