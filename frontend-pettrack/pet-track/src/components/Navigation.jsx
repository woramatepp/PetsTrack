import React from 'react';
 
function Navigation({ activeTab, setActiveTab }) {
  // This component is now handled in Header.jsx
  // Keeping this as fallback if used separately
  
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'myPets', label: 'My Pets' }
  ];
 
  return (
    <nav className="flex gap-6 mb-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-6 py-2 font-medium transition-colors text-sm ${
            activeTab === tab.id
              ? 'text-amber-700 border-b-2 border-amber-700'
              : 'text-gray-500 border-b-2 border-transparent hover:text-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
 
export default Navigation;