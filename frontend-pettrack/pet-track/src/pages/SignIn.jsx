import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function SignIn() {
    const { login } = useAuth(); // ดึงฟังก์ชัน login มาจาก Context
    const navigate = useNavigate();

    // เพิ่ม State ที่จำเป็นสำหรับการเก็บค่าในฟอร์ม
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignIn = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // ยิง API ไปที่ Backend (แก้ไข URL ให้ตรงกับ API Gateway/Auth Service ของคุณ)
            const response = await fetch('/user/login', { // เปลี่ยน port และ path ให้ตรงกับระบบของคุณ
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email, password: password })
            });

            const data = await response.json();

            // เช็คว่า API ตอบกลับมาว่ารหัสผิดพลาดหรือไม่ (status ไม่ใช่ 200)
            if (!response.ok) {
                // โยน error message ที่ได้จาก backend ออกไปแสดงผล
                throw new Error(data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'); 
            }

            // ถ้ารหัสถูก นำข้อมูล user และ token ที่ Backend ส่งมาให้ เก็บลง Context
            // (ต้องเช็คว่า API ของคุณ return ค่ากลับมาในรูปแบบไหน เช่น data.user, data.token)
            login(data.user, data.token);

            // เด้งไปหน้าแรก
            navigate('/');

        } catch (err) {
            console.error(err);
            setError(err.message || 'ล็อกอินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#e8dcc8] flex items-center justify-center p-6 text-slate-800">
            <div className="bg-[#fefbea] rounded-3xl p-10 shadow-lg w-full max-w-lg space-y-8">
                <div className="space-y-2 text-center pb-4 border-b border-slate-200">
                    <h1 className="text-5xl font-extrabold text-teal-600">PetTrack</h1>
                    <p className="text-xl text-slate-600">Sign in to your account</p>
                </div>

                {/* แสดงกล่อง Error หากมีข้อผิดพลาด */}
                {error && <div className="p-4 rounded-xl bg-red-100 text-red-800 text-center font-bold text-sm">{error}</div>}

                <form onSubmit={handleSignIn} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-4 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-teal-300"
                            placeholder="Enter your email"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-4 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-teal-300"
                            placeholder="Enter your password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full p-4 rounded-full bg-teal-500 text-white font-bold text-lg hover:bg-teal-600 transition disabled:bg-teal-300 flex justify-center items-center"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="text-center pt-6 text-sm text-slate-600">
                    Don't have an account? <Link to="/signup" className="font-bold text-teal-600 hover:underline">Sign Up now</Link>
                </div>
            </div>
        </div>
    );
}

export default SignIn;