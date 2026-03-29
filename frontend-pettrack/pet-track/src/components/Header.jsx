import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Header() {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-md">
      <Link to="/overview" className="text-xl font-bold">PetsTrack</Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
            <Link to="/profile">
              <img
                src={user.profileImage || "/default-avatar.png"}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
              />
            </Link>
          </>
        ) : (
          <Link
            to="/signin"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;