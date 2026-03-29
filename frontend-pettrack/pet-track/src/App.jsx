import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Overview from './pages/Overview';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile'; // หน้าใหม่
import AddPet from './pages/AddPet'; // หน้าใหม่ (หน้า PetType ในรูป)

// Component ช่วยล็อกหน้า (ถ้าไม่ล็อกอิน จะเด้งไปหน้า Sign In)
const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// Component ช่วยล็อกหน้า (ถ้าล็อกอินแล้ว จะเข้าหน้า Sign In/Up ไม่ได้)
const PublicRoute = ({ children }) => {
    const { user } = useAuth();
    if (user) {
        return <Navigate to="/" replace />;
    }
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Navbar />
                <Routes>
                    {/* หน้าที่ใครๆ ก็เข้าได้ หรือต้องล็อกอินถึงจะเห็นหมุด */}
                    <Route path="/" element={<Overview />} />

                    {/* หน้าที่ต้องยังไม่ล็อกอิน */}
                    <Route path="/login" element={<PublicRoute><SignIn /></PublicRoute>} />
                    <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />

                    {/* หน้าที่ต้องล็อกอินเท่านั้น */}
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/add-pet" element={<ProtectedRoute><AddPet /></ProtectedRoute>} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;