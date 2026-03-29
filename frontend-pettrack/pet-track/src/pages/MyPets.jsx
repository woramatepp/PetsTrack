// src/pages/MyPets.jsx
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import PetListingCard from '../components/PetListingCard';

// Using the warm color palette: background: #e8dcc8, main container: #fefbea
// src/pages/MyPets.jsx
function MyPets() {
    const [pets, setPets] = useState([]);
    const [editingPet, setEditingPet] = useState(null); // 🌟 State สำหรับแก้ไข

    const handleUpdate = async (updatedData) => {
        // fetch(`/pets/${updatedData.id}`, { method: 'PUT', ... })
        setEditingPet(null);
        // Refresh data...
    };

    return (
        <div className="min-h-screen bg-[#e8dcc8]">
            <Navbar />
            <div className="max-w-7xl mx-auto p-8">
                <div className="bg-[#fefbea] rounded-3xl p-10 shadow-lg">
                    <h1 className="text-4xl font-bold mb-8">My Pets</h1>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {pets.map(pet => (
                            <div key={pet.id} className="relative">
                                <PetListingCard petData={pet} />
                                <button
                                    onClick={() => setEditingPet(pet)}
                                    className="mt-2 w-full bg-teal-500 text-white py-2 rounded-lg"
                                >
                                    Edit Details
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* 🌟 แสดง Modal แก้ไขเมื่อกดปุ่ม */}
            {editingPet && <EditModal pet={editingPet} onClose={() => setEditingPet(null)} onSave={handleUpdate} />}
        </div>
    );
}

export default MyPets;