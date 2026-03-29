import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  // ดึงค่า user กับฟังก์ชัน logout ออกมาจาก Context ที่เราเพิ่งแก้ไป
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // เคลียร์ localStorage และ State
    navigate('/login'); // เตะกลับไปหน้า Login ทันที
  };

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      {/* โลโก้ หรือชื่อแอป */}
      <Link to="/" className="text-2xl font-bold text-blue-600">
        PetsTrack
      </Link>

      {/* เมนูด้านขวา */}
      <div className="flex items-center gap-4">
        {/* เช็คเงื่อนไข: ถ้า user มีข้อมูล (ล็อกอินแล้ว) */}
        {user ? (
          <>
            {/* แสดงรูปโปรไฟล์ กดแล้วไปหน้าแก้ไขโปรไฟล์ */}
            <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg transition-colors">
              <img
                src={user.profileImage || "https://ui-avatars.com/api/?name=" + (user.name || "U") + "&background=random"}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-blue-200 object-cover"
              />
              {/* แสดงชื่อ หรือ อีเมล */}
              <span className="font-medium text-gray-700 hidden sm:block">
                {user.name || user.email}
              </span>
            </Link>

            {/* ปุ่ม Logout */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white font-medium rounded hover:bg-red-600 transition-colors shadow-sm"
            >
              Logout
            </button>
          </>
        ) : (
          /* ถ้ายังไม่ล็อกอิน ให้แสดงปุ่ม Login / Sign Up ตามปกติ */
          <>
            <Link to="/login" className="px-4 py-2 text-blue-600 font-medium hover:text-blue-800 transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors shadow-sm">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;