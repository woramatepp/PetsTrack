// src/components/MapSection.jsx
import React from 'react';

function MapSection({ petName = "Luna", location = "Home" }) {
  // This is a placeholder for a real map
  return (
    <div className="relative w-full h-[38rem] bg-slate-200 rounded-3xl overflow-hidden shadow-lg border-4 border-white flex flex-col items-center justify-center">
      {/* Map Content Placeholder (pin, zone, etc.) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-slate-600 space-y-4">
        {/* Placeholder Map pin and circle */}
        <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-amber-300 opacity-80 scale-[2]"></div>
            <div className="absolute inset-0 rounded-full bg-amber-200 opacity-60 scale-125"></div>
            <div className="w-8 h-8 rounded-full bg-amber-400 border-4 border-white shadow-xl flex items-center justify-center text-xl">📍</div>
        </div>
        <p className="text-3xl font-extrabold text-slate-800">{petName} ({location})</p>
        <p className="text-lg text-slate-500 font-semibold pt-1">Zone Status: Active</p>
        <p className="text-gray-500 font-mono text-sm">( Real Map view placeholder )</p>
      </div>
      {/* Background graphic simulation */}
      <div className="absolute inset-0 grid grid-cols-12 gap-0 opacity-10">
        {[...Array(144)].map((_, i) => <div key={i} className="border border-gray-400"></div>)}
      </div>
    </div>
  );
}

export default MapSection;