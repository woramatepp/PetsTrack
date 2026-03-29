import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogOut } from 'lucide-react'; // ใช้ Icon สวยๆ

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ฟังก์ชันช่วยแสดงรูปโปรไฟล์ หรือ Icon ถ้าไม่มีรูป
  const renderAvatar = () => {
    if (user && user.avatar_url) {
      return (
        <img
          src={user.avatar_url} // URL จาก API Gateway
          alt="User Avatar"
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
        />
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white shadow">
        <User className="w-6 h-6 text-slate-500" />
      </div>
    );
  };

  return (
    <nav className="bg-[#fefbea] shadow-md sticky top-0 z-[1000] p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-3xl font-extrabold text-teal-600 tracking-tighter">
          PetTrack
        </Link>

        <div className="flex items-center gap-6 font-semibold text-slate-700">
          <Link to="/" className="hover:text-teal-600 transition">Overview</Link>

          {user && (
            <Link to="/add-pet" className="hover:text-teal-600 transition">Add Pet</Link>
          )}

          {/* แบ่งฝั่งซ้าย-ขวา */}
          <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
            {user ? (
              // ส่วนเมื่อล็อกอินแล้ว
              <>
                <Link to="/profile" title="แก้ไขโปรไฟล์">
                  {renderAvatar()}
                </Link>
                <span className="text-sm font-medium text-slate-600 hidden md:inline">
                  {user.name || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-red-50 text-red-600 transition"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            ) : (
              // ส่วนเมื่อยังไม่ได้ล็อกอิน
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-full bg-teal-500 text-white font-bold hover:bg-teal-600 transition shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;