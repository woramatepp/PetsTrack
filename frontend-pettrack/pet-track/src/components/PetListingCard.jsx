import React from 'react';
import { Link } from 'react-router-dom';

function PetListingCard({ pet, onDelete }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold">
          {pet.name.charAt(0)}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-800">{pet.name}</h3>
          <p className="text-slate-500">{pet.type} • {pet.breed}</p>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-50">
        <Link
          to={`/editpet/${pet.ID}`} // ส่ง ID ไปที่หน้าแก้ไข
          className="flex-1 text-center py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
        >
          แก้ไขข้อมูล
        </Link>
        <button
          onClick={onDelete}
          className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100"
        >
          ลบข้อมูล
        </button>
      </div>
    </div>
  );
}

export default PetListingCard;