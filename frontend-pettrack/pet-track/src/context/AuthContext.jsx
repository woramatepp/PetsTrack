import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. สร้าง Context
export const AuthContext = createContext();

// 2. สร้าง Hook เอาไว้ใช้ในไฟล์อื่นๆ
export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // สำคัญมาก เพื่อรอเช็ค localStorage ก่อน

    // useEffect จะทำงานตอนที่เปิดเว็บขึ้นมาครั้งแรก
    useEffect(() => {
        // ดึงข้อมูลที่เคยบันทึกไว้กลับมา
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setUser(JSON.parse(storedUser)); // คืนค่า State user กลับมา
        }
        setLoading(false); // เช็คเสร็จแล้ว ค่อยอนุญาตให้แอปทำงานต่อ
    }, []);

    // ฟังก์ชันสำหรับ Login (ให้เอาไปเรียกใช้ตอนยิง API สำเร็จ)
    const login = (userData, token) => {
        localStorage.setItem('token', token); // เก็บ Token ไว้ใช้กับ API ต่อไป
        localStorage.setItem('user', JSON.stringify(userData)); // เก็บข้อมูล User
        setUser(userData); // อัปเดต State ให้แอปเปลี่ยนหน้าตา
    };

    // ฟังก์ชันสำหรับ Logout (เรียกตอนกดปุ่ม Logout)
    const logout = () => {
        localStorage.removeItem('token'); // ลบทิ้ง
        localStorage.removeItem('user');  // ลบทิ้ง
        setUser(null); // เคลียร์ State
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {/* ต้องรอให้โหลด localStorage เสร็จก่อน ถึงจะ render หน้าเว็บ ไม่งั้นมันจะเด้งไปหน้า login ก่อน */}
            {!loading && children}
        </AuthContext.Provider>
    );
};