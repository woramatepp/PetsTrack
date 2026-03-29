import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth(); // ดึงข้อมูล user จาก AuthContext
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout(); // เรียกฟังก์ชัน logout เพื่อล้างข้อมูลใน localStorage
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">

      {/* ส่วนซ้าย: โลโก้ และ เมนูนำทาง */}
      <div className="flex items-center gap-8">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          PetsTrack
        </Link>

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

      {/* เมนูด้านขวา: แสดงอีเมล และ ปุ่มออกจากระบบ */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            {/* แสดงเฉพาะอีเมลในรูปแบบข้อความธรรมดา (ไม่เป็น Link) */}
            <span className="font-medium text-gray-700 py-2">
              {user.email}
            </span>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white font-medium rounded hover:bg-red-600 transition-colors shadow-sm"
            >
              Logout
            </button>
          </>
        ) : (
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