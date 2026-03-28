import React from 'react';
 
function Header() {
  return (
    <header className="bg-yellow-100">
      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Header container - like pill/rounded box */}
        <div className="bg-white rounded-full shadow-sm px-8 py-4 flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-lg">🐾</span>
            </div>
            <h1 className="text-xl font-bold text-amber-900">PetTrack</h1>
          </div>
 
          {/* Navigation Tabs */}
          <div className="flex items-center gap-8 flex-1 px-6">
            <button className="text-amber-700 font-medium text-sm hover:text-amber-900">
              Overview
            </button>
            <button className="text-gray-500 font-medium text-sm hover:text-gray-700">
              My Pets
            </button>
          </div>
 
          {/* Profile icon */}
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </header>
  );
}
 
export default Header;