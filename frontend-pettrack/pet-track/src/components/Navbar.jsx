import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // เพิ่มเข้ามาเพื่อเช็ค URL ปัจจุบัน สำหรับทำแถบสีไฮไลท์

  const handleLogout = () => {
    logout(); // เคลียร์ localStorage และ State
    navigate('/login'); // เตะกลับไปหน้า Login ทันที
  };

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">

      {/* ส่วนซ้าย: โลโก้ และ เมนูนำทาง */}
      <div className="flex items-center gap-8">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          PetsTrack
        </Link>

        {/* เมนูแท็บ Overview และ My Pets (จะแสดงเมื่อล็อกอินแล้วเท่านั้น) */}
        {user && (
          <div className="hidden sm:flex gap-6 items-center pt-1">
            <Link
              to="/"
              className={`pb-1 font-medium transition-colors ${location.pathname === '/'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-blue-500'
                }`}
            >
              Overview
            </Link>
            <Link
              to="/mypets"
              className={`pb-1 font-medium transition-colors ${location.pathname === '/mypets'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-blue-500'
                }`}
            >
              My Pets
            </Link>
          </div>
        )}
      </div>

      {/* เมนูด้านขวา: โปรไฟล์ และ ออกจากระบบ */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg transition-colors">
              <img
                src={user.profileImage || "https://ui-avatars.com/api/?name=" + (user.name || "U") + "&background=random"}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-blue-200 object-cover"
              />
              <span className="font-medium text-gray-700 hidden sm:block">
                {user.name || user.email}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white font-medium rounded hover:bg-red-600 transition-colors shadow-sm"
            >
              Logout
            </button>
          </>
        ) : (
          /* ถ้ายังไม่ล็อกอิน ให้แสดงปุ่ม Sign In / Sign Up */
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