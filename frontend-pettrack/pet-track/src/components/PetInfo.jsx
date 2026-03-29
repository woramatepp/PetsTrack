// src/components/PetInfo.jsx
import React from 'react';

function PetInfo({ petData }) {
  if (!petData) return <div className="p-4 bg-white rounded-2xl shadow-md">Loading pet info...</div>;

  // Destructure the data, providing defaults
  const { 
    name = 'No Name', 
    type = 'Unknown Type', 
    sex = 'Unknown Gender', 
    weight = 'Unknown Weight', 
    age = 'Unknown Age', 
    favoriteFood = 'None',
    status = 'HOME' // Default status
  } = petData;

  const infoItems = [
    { key: 'Sex', value: sex, icon: '♀️' }, // Placeholder for icon
    { key: 'Weight', value: weight, icon: '⚖️' }, // Placeholder for icon
    { key: 'Age', value: age, icon: '📅' }, // Placeholder for icon
    { key: 'Favorite Food', value: favoriteFood, icon: '🥣' }, // Placeholder for icon
  ];

  return (
    <div className="bg-white p-6 rounded-3xl shadow-md space-y-5 text-slate-800">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {infoItems.map(item => (
          <div key={item.key} className="flex items-center space-x-2">
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-lg">
              {item.icon}
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{item.key}:</p>
              <p className="text-sm font-semibold text-slate-800">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex flex-col space-y-1.5 pt-1">
        <h1 className="text-4xl font-extrabold text-slate-800">{name}</h1>
        <p className="text-base text-slate-500 font-medium pb-2">Type: {type}</p>
        
        <div className="flex space-x-3">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-sm font-bold shadow-inner">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
            Status: {status}
          </div>
          <button className="px-5 py-2 rounded-full bg-teal-500 text-white text-sm font-bold shadow-md hover:bg-teal-600 transition">
            See Tracker
          </button>
        </div>
      </div>
    </div>
  );
}

export default PetInfo;