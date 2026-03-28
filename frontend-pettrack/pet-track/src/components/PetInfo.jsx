import React from 'react';
 
function PetInfo({ petData }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-yellow-100 overflow-hidden">
      {/* Header */}
      <div className="bg-yellow-50 px-6 py-3">
        <h2 className="text-base font-bold text-amber-800">Pet Info</h2>
      </div>
 
      {/* Content */}
      <div className="px-6 py-4 space-y-3">
        {/* Row 1: Type, Name, Sex */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-amber-700 font-semibold mb-1">Type</p>
            <p className="text-sm font-semibold text-amber-700">{petData.type}</p>
          </div>
          <div>
            <p className="text-xs text-amber-700 font-semibold mb-1">Name</p>
            <p className="text-sm font-semibold text-amber-700">{petData.name}</p>
          </div>
          <div>
            <p className="text-xs text-amber-700 font-semibold mb-1">Sex</p>
            <p className="text-sm font-semibold text-amber-700">{petData.sex}</p>
          </div>
        </div>
 
        {/* Row 2: Age, Weight, Favorite Food */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-amber-700 font-semibold mb-1">Age</p>
            <p className="text-sm font-semibold text-amber-700">{petData.age}</p>
          </div>
          <div>
            <p className="text-xs text-amber-700 font-semibold mb-1">Weight</p>
            <p className="text-sm font-semibold text-amber-700">{petData.weight}</p>
          </div>
          <div>
            <p className="text-xs text-amber-700 font-semibold mb-1">Favorite Food</p>
            <p className="text-sm font-semibold text-amber-700">{petData.favoriteFood}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
 
export default PetInfo;