import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Overview from './pages/Overview';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import MyPets from './pages/MyPets';
import AddPet from './pages/AddPet';
import EditPet from './pages/EditPet';

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
    const { user } = useAuth();
    return !user ? children : <Navigate to="/" replace />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Overview />} />
                    <Route path="/login" element={<PublicRoute><SignIn /></PublicRoute>} />
                    <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />

                    {/* หน้าที่ต้องล็อกอิน */}
                    <Route path="/mypets" element={<ProtectedRoute><MyPets /></ProtectedRoute>} />
                    <Route path="/addpet" element={<ProtectedRoute><AddPet /></ProtectedRoute>} />
                    <Route path="/editpet/:id" element={<ProtectedRoute><EditPet /></ProtectedRoute>} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;