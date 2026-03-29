import { useState } from 'react';

function MyPets() {
    const [petData, setPetData] = useState({ name: '', type: '', breed: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        // นำ petData ไปยิง API เพื่อบันทึกลง Database
        console.log('บันทึกสัตว์เลี้ยง:', petData);
        alert('เพิ่มสัตว์เลี้ยงสำเร็จ!');
        setPetData({ name: '', type: '', breed: '' }); // clear form
    };

    return (
        <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
            <h2 className="text-2xl font-bold mb-6">ข้อมูลสัตว์เลี้ยงของฉัน</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700">ชื่อสัตว์เลี้ยง</label>
                    <input
                        type="text"
                        value={petData.name}
                        onChange={(e) => setPetData({ ...petData, name: e.target.value })}
                        className="w-full border p-2 rounded" required
                    />
                </div>
                <div>
                    <label className="block text-gray-700">ประเภท (เช่น สุนัข, แมว)</label>
                    <input
                        type="text"
                        value={petData.type}
                        onChange={(e) => setPetData({ ...petData, type: e.target.value })}
                        className="w-full border p-2 rounded" required
                    />
                </div>
                <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
                    เพิ่มสัตว์เลี้ยง
                </button>
            </form>
        </div>
    );
}

export default MyPets;