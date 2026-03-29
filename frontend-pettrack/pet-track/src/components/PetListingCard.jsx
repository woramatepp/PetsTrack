// src/components/PetListingCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import PetCard from './PetCard';
import PetInfo from './PetInfo';

function PetListingCard({ petData }) {
  // Stack PetCard and PetInfo vertically for a list view
  return (
    <div className="flex flex-col space-y-4">
      <div className="h-64 sm:h-72 w-full"> {/* Define height for the image in list */}
        <PetCard petImage={petData.image} />
      </div>
      <div className="flex-1">
        <PetInfo petData={petData} />
      </div>
      {/* Optional: Add an Edit or View Details button at the bottom */}
      {/* <div className="p-4 pt-0">
        <Link to={`/edit-pet/${petData.name}`} className="block w-full text-center p-3 rounded-xl bg-slate-800 text-white font-semibold">
          Edit Pet
        </Link>
      </div> */}
    </div>
  );
}

export default PetListingCard;