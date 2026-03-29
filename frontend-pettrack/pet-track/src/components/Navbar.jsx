// src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // 🌟 Add this import

function Navbar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'overview', name: 'Overview', path: '/' },
    { id: 'myPets', name: 'My Pets', path: '/mypets' }, // Update path
    { id: 'tracking', name: 'Tracking', path: '/tracking' },
    { id: 'notifications', name: 'Notifications', path: '/notifications' }
  ];

  return (
    <nav className="bg-[#fefbea] border-b border-slate-200 text-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-3xl font-extrabold text-slate-800">PetTrack</Link>
        <div className="flex space-x-2">
          {tabs.map(tab => (
            <Link 
              key={tab.id}
              to={tab.path} // Use Link instead of button
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-full text-base font-semibold transition ${
                activeTab === tab.id 
                  ? 'bg-amber-100 text-slate-900' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            ></Link>
          ))}
        </div>
        <div className="flex items-center space-x-3">
          {/* Example: Profile or Sign out Link */}
           <Link to="/login" className="px-5 py-2 rounded-xl bg-slate-800 text-white font-medium text-sm">Sign In</Link>
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-inner flex items-center justify-center text-lg">👤</div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;