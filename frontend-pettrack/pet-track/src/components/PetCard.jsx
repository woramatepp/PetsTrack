import React from 'react';
 
function PetCard({ petImage }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-yellow-100">
      {/* Pet Image */}
      <div className="relative w-full bg-gray-100 overflow-hidden" style={{ paddingBottom: '100%' }}>
        <img
          src={petImage}
          alt="Pet"
          className="absolute inset-0 w-full h-full object-cover rounded-xl"
          style={{
            margin: '8px',
            width: 'calc(100% - 16px)',
            height: 'calc(100% - 16px)',
          }}
        />
      </div>
    </div>
  );
}
 
export default PetCard;