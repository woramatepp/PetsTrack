import React from 'react';
 
function Navbar({ activeTab, setActiveTab }) {
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-full mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-2 min-w-fit">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-lg">🐾</span>
            </div>
            <h1 className="text-xl font-bold text-amber-900 whitespace-nowrap">PetTrack</h1>
          </div>
 
          {/* Center: Navigation Tabs */}
          <div className="flex-1 flex items-center justify-center gap-12">
            <button
              onClick={() => setActiveTab('overview')}
              className={`text-base font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-amber-700 border-b-2 border-amber-700 pb-1'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('myPets')}
              className={`text-base font-medium transition-colors ${
                activeTab === 'myPets'
                  ? 'text-amber-700 border-b-2 border-amber-700 pb-1'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Pets
            </button>
          </div>
 
          {/* Right: Logout Button */}
          <button 
            onClick={() => {
              // Add your logout logic here
              // window.location.href = '/login';
            }}
            className="ml-12 px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors whitespace-nowrap"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
 
export default Navbar;