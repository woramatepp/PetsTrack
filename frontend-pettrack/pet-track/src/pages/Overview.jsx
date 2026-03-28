import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import MapSection from '../components/MapSection';
import PetCard from '../components/PetCard';
import PetInfo from '../components/PetInfo';
 
function Overview() {
  const [activeTab, setActiveTab] = useState('overview');
 
  // Mock pet data
  const petData = {
    name: 'Tawan',
    type: 'Cat',
    sex: 'Male',
    weight: '300 kg',
    age: '7 year',
    favoriteFood: 'fish',
    image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500&h=400&fit=crop'
  };
 
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e8dcc8' }}>
      {/* Navbar Only */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
 
      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Content Area - Match exact design from image */}
        {activeTab === 'overview' && (
          <div className="mt-4">
            {/* Main container with peach background */}
            <div className="bg-yellow-100 rounded-3xl p-8 shadow-lg">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left: Map Section - spans 3 columns */}
                <div className="lg:col-span-3">
                  <MapSection />
                </div>
 
                {/* Right: Pet Card + Info - spans 2 columns */}
                <div className="lg:col-span-2 space-y-6">
                  <PetCard petImage={petData.image} />
                  <PetInfo petData={petData} />
                </div>
              </div>
            </div>
          </div>
        )}
 
        {/* My Pets Tab (placeholder) */}
        {activeTab === 'myPets' && (
          <div className="mt-4 p-8 bg-yellow-100 rounded-3xl text-center">
            <p className="text-gray-600 text-lg">My Pets section coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
 
export default Overview;