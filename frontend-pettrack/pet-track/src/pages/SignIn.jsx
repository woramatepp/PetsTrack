// src/pages/SignIn.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function SignIn() {
    const [email, setEmail] = useState(''); // เปลี่ยนจาก username เป็น email
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignIn = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // ยิงไปที่ API Gateway /user/login (ซึ่งจะส่งต่อไปยัง auth-service)
            const response = await fetch('/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: password
                }),
                credentials: 'include', // ส่ง Cookie กลับมาเก็บที่ Browser
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Invalid email or password');
            }

            navigate('/');
        } catch (err) {
            setError(err.message);
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
                        className="w-full p-4 rounded-full bg-teal-500 text-white font-bold text-lg hover:bg-teal-600 transition disabled:bg-teal-300"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="text-center pt-6 text-sm text-slate-600">
                    Don't have an account? <Link to="/signup" className="font-bold text-teal-600">Sign Up now</Link>
                </div>
            </div>
        </div>
    );
}

export default SignIn;