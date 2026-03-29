import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function SignUp() {
    const [email, setEmail] = useState(''); // ใช้ email แทน username
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // ในไฟล์ SignUp.jsx
    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');

        // 🌟 1. เช็คความถูกต้องของรหัสผ่านก่อนเลย
        if (password !== confirmPassword) {
            setError('รหัสผ่าน และ ยืนยันรหัสผ่าน ไม่ตรงกัน');
            return;
        }

        setLoading(true);

        try {
            // 🌟 2. ระบุ URL เต็มๆ ชี้ไปที่ API Gateway พอร์ต 8080 (หรือเปลี่ยนตามพอร์ตที่คุณใช้)
            const response = await fetch('/user/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: password
                }),
                credentials: 'include', // อย่าลืมใส่ตัวนี้ในทั้ง Sign Up และ Sign In เพื่อให้รับ Cookie ได้
            });

            // 🌟 3. ตรวจสอบสถานะก่อนค่อยอ่านข้อมูล
            if (!response.ok) {
                // พยายามอ่าน Error Message จาก Backend (ถ้าพังก็อ่านเป็น Text ธรรมดา)
                let errorMsg = `Error ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch {
                    errorMsg = "ระบบมีปัญหา (หรือหา API ไม่เจอ)";
                }
                throw new Error(errorMsg);
            }

            // ถ้าสถานะโอเค ค่อยอ่านข้อมูล
            const data = await response.json();

            // พาไปหน้า Login
            navigate('/login');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#e8dcc8] flex items-center justify-center p-6">
            <div className="bg-[#fefbea] rounded-3xl p-10 shadow-lg w-full max-w-lg space-y-8">
                <div className="text-center pb-4 border-b border-slate-200">
                    <h1 className="text-5xl font-extrabold text-slate-800">Sign Up</h1>
                    <p className="text-xl text-slate-600">Create your account with email</p>
                </div>

                {error && <div className="p-4 rounded-xl bg-red-100 text-red-800 text-center text-sm font-bold">{error}</div>}

                <form onSubmit={handleSignUp} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-300 outline-none"
                            placeholder="example@email.com"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-300 outline-none"
                            placeholder="Minimum 6 characters"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-300 outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full p-4 rounded-full bg-teal-500 text-white font-bold text-lg hover:bg-teal-600 transition disabled:bg-teal-300"
                    >
                        {loading ? 'Processing...' : 'Register Account'}
                    </button>
                </form>
                <div className="text-center pt-4 text-slate-600">
                    Already have an account? <Link to="/login" className="text-teal-600 font-bold">Sign In</Link>
                </div>
            </div>
        </div>
    );
}

export default SignUp;