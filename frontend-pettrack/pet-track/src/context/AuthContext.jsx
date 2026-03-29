import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

// Hook ง่ายๆ สำหรับเรียกใช้ใน Component อื่น
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // ตรวจสอบสถานะการล็อกอินเมื่อเปิดเว็บครั้งแรก
    useEffect(() => {
        checkLoggedIn();
    }, []);

    const checkLoggedIn = async () => {
        try {
            const response = await fetch('/user/me', {
                //credentials: 'include' // สำคัญ! ส่ง Cookie ไปด้วย
            });
            if (response.ok) {
                const data = await response.json();
                setUser(data); // เก็บข้อมูลผู้ใช้ลง State
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = (userData) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            await fetch('/user/logout', { method: 'POST' });
        } catch (error) {
            console.error("Logout failed:", error);
        }
        setUser(null);
        // สามารถใช้ window.location.href = '/login' เพื่อ force reload ได้
    };

    // ป้องกันการ Render หน้าเว็บก่อนจะเช็คสถานะเสร็จ
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#e8dcc8]">Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, checkLoggedIn }}>
            {children}
        </AuthContext.Provider>
    );
};