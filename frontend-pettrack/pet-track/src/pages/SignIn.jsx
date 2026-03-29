// src/pages/SignIn.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function SignIn() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignIn = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 🌟 Replace with your fetch to /user/login
            const response = await fetch('/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Email: email,      // ส่ง Email ไปตรวจสอบ
                    Password: password
                }),
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Invalid username or password');
            }

            // Successful login
            navigate('/'); // Redirect to homepage
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
                    <h1 className="text-5xl font-extrabold">PetTrack</h1>
                    <p className="text-xl text-slate-600">Sign in to your account</p>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-red-100 text-red-800 text-center font-semibold text-sm shadow-inner">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignIn} className="space-y-6">
                    <div className="space-y-1.5">
                        <label htmlFor="username" className="text-sm font-semibold text-slate-700">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full p-4 rounded-xl bg-white border border-slate-200 shadow-inner text-base text-slate-800 focus:ring-2 focus:ring-teal-300 outline-none transition"
                            placeholder="Enter your username"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-4 rounded-xl bg-white border border-slate-200 shadow-inner text-base text-slate-800 focus:ring-2 focus:ring-teal-300 outline-none transition"
                            placeholder="Enter your password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full p-4 rounded-full bg-teal-500 text-white font-bold text-lg shadow-md hover:bg-teal-600 transition disabled:bg-teal-300"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="text-center pt-6 border-t border-slate-200 text-sm text-slate-600">
                    <p>
                        Don't have an account?{' '}
                        <Link to="/register" className="font-bold text-teal-600 hover:text-teal-700">
                            Sign Up now
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SignIn;