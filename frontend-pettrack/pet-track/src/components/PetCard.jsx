// src/components/PetCard.jsx
import React from 'react';

function PetCard({ petImage }) {
  // Use a default image if none is provided
  const imageUrl = petImage || 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500&h=400&fit=crop';
  
  return (
    <div className="w-full h-auto rounded-3xl overflow-hidden shadow-md">
      <img 
        src={imageUrl} 
        alt="Pet" 
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export default PetCard;